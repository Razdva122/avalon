import mongoose, { Schema } from 'mongoose';
import { randomUUID, createHash } from 'crypto';
import { supportOrderModel } from '../repository';
import { SupportOrder } from '../service';
import { userProfileModel } from '@/db/models';
import { configuredNetworks, NetworkConfig, publicNetwork } from './config';
import { normalizeTxid } from './protocol';
import { networkReady, readTransfer, valueTransfer } from './chains';

const limitSchema = new Schema({ _id: String, lastAt: Date, expiresAt: Date });
limitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const limitModel = mongoose.model('DirectSupportLimit', limitSchema);
const retryStatuses = ['waiting', 'confirming', 'provider_unavailable'];
const deadlineMs = 60 * 60 * 1000;
interface Dependencies {
  networks: typeof configuredNetworks;
  ready: typeof networkReady;
  read: typeof readTransfer;
  value: typeof valueTransfer;
  now: () => Date;
}
function duplicate(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}
function paymentKey(c: NetworkConfig, txid: string): string {
  return `direct:${c.id}:${txid}:${c.asset}:${c.chainId ? c.address.toLowerCase() : c.address}`;
}
export class DirectService {
  private deps: Dependencies;
  private health = new Map<string, { until: number; result: Promise<boolean> }>();
  constructor(deps: Partial<Dependencies> = {}) {
    this.deps = {
      networks: configuredNetworks,
      ready: networkReady,
      read: readTransfer,
      value: valueTransfer,
      now: () => new Date(),
      ...deps,
    };
  }
  async availableNetworks() {
    const available = await Promise.all(
      this.deps.networks().map(async (c) => ((await this.isReady(c)) ? publicNetwork(c) : null)),
    );
    return available.filter((c): c is ReturnType<typeof publicNetwork> => c !== null);
  }
  private isReady(c: NetworkConfig): Promise<boolean> {
    const key = JSON.stringify(c);
    const now = this.deps.now().getTime();
    const cached = this.health.get(key);
    if (cached && cached.until > now) return cached.result;
    const result = this.deps.ready(c).catch(() => false);
    this.health.set(key, { until: now + 60000, result });
    return result;
  }
  private async throttle(userID: string) {
    const now = this.deps.now();
    try {
      await limitModel.updateOne({ _id: userID }, { $setOnInsert: { lastAt: new Date(0) } }, { upsert: true });
    } catch (error) {
      if (!duplicate(error)) throw error;
    }
    const claim = await limitModel.findOneAndUpdate(
      { _id: userID, lastAt: { $lte: new Date(now.getTime() - 60000) } },
      { $set: { lastAt: now, expiresAt: new Date(now.getTime() + 3600000) } },
    );
    if (!claim) throw new Error('too_many_requests');
  }
  async submit(userID: string, network: string, input: unknown, anonymous: boolean): Promise<SupportOrder> {
    const txid = normalizeTxid(network, input);
    if (typeof anonymous !== 'boolean') throw new Error('invalid_request');
    const c = this.deps.networks().find((n) => n.id === network);
    if (!c) throw new Error('unavailable');
    const key = paymentKey(c, txid);
    const finished = await supportOrderModel.findOne({ paymentID: key }).lean();
    if (finished) {
      if (finished.userID !== userID) throw new Error('already_claimed');
      return finished;
    }
    const claimKey = createHash('sha256')
      .update(JSON.stringify([userID, key]))
      .digest('hex');
    const existing = await supportOrderModel.findOne({ claimKey }).lean();
    if (existing) {
      if (existing.userID !== userID || existing.status === 'duplicate') throw new Error('already_claimed');
      return existing;
    }
    if (!(await this.isReady(c))) throw new Error('unavailable');
    await this.throttle(userID);
    const now = this.deps.now();
    const orderId = randomUUID();
    try {
      await supportOrderModel.create({
        orderId,
        claimKey,
        userID,
        provider: 'direct',
        sandbox: false,
        amountCents: 0,
        payCurrency: c.asset,
        anonymous,
        status: 'waiting',
        createdAt: now,
        direct: {
          network: c.id,
          txid,
          address: c.address,
          contract: c.contract,
          decimals: c.decimals,
          attempts: 0,
          nextCheckAt: now,
          reassignments: [],
        },
      });
    } catch (error) {
      if (!duplicate(error)) throw error;
      const repeat = await supportOrderModel.findOne({ claimKey, userID }).lean();
      if (!repeat) throw error;
      return repeat;
    }
    await this.processOne(orderId);
    return (await supportOrderModel.findOne({ orderId, userID }).lean())!;
  }
  async refresh(orderId: string, userID: string): Promise<SupportOrder> {
    const order = await supportOrderModel.findOne({ orderId, userID, provider: 'direct' }).lean();
    if (!order) throw new Error('not_found');
    if (order.status === 'finished') return order;
    if (order.status === 'duplicate') throw new Error('already_claimed');
    await this.throttle(userID);
    await this.processOne(orderId, true);
    return (await supportOrderModel.findOne({ orderId, userID }).lean())!;
  }
  async processOne(orderId?: string, force = false): Promise<boolean> {
    const now = this.deps.now();
    const token = randomUUID();
    const order = await supportOrderModel
      .findOneAndUpdate(
        {
          provider: 'direct',
          ...(orderId ? { orderId } : {}),
          status: { $in: force ? [...retryStatuses, 'check_expired', 'rejected'] : retryStatuses },
          ...(!force ? { 'direct.nextCheckAt': { $lte: now } } : {}),
          $or: [{ 'direct.leaseUntil': { $exists: false } }, { 'direct.leaseUntil': { $lte: now } }],
        },
        { $set: { 'direct.leaseToken': token, 'direct.leaseUntil': new Date(now.getTime() + 120000) } },
        { new: true, sort: { 'direct.nextCheckAt': 1 } },
      )
      .lean();
    if (!order?.direct) return false;
    const match = { orderId: order.orderId, 'direct.leaseToken': token, status: { $ne: 'finished' } };
    const release = { 'direct.leaseToken': '', 'direct.leaseUntil': '' };
    const stop = async (status: string) => {
      await supportOrderModel.updateOne(match, { $set: { status }, $unset: { ...release, 'direct.nextCheckAt': '' } });
    };
    if (!force && now.getTime() - order.createdAt.getTime() >= deadlineMs) {
      await stop('check_expired');
      return true;
    }
    const retry = async (status: string) => {
      const attempts = order.direct!.attempts + 1;
      const delay = Math.min(3600000, 60000 * 2 ** Math.min(attempts - 1, 6));
      const expires = order.createdAt.getTime() + deadlineMs;
      if (now.getTime() >= expires) {
        await stop('check_expired');
        return;
      }
      await supportOrderModel.updateOne(match, {
        $set: {
          status,
          'direct.attempts': attempts,
          'direct.nextCheckAt': new Date(Math.min(expires, now.getTime() + delay)),
        },
        $unset: release,
      });
    };
    try {
      const current = this.deps.networks().find((c) => c.id === order.direct!.network);
      if (!current || !(await this.isReady(current))) throw new Error('unavailable');
      const config = {
        ...current,
        address: order.direct.address,
        contract: order.direct.contract,
        decimals: order.direct.decimals,
      };
      const transfer = await this.deps.read(config, order.direct.txid);
      if (transfer.status === 'rejected') {
        await stop('rejected');
        return true;
      }
      if (transfer.status !== 'verified') {
        await retry(transfer.status);
        return true;
      }
      if (!transfer.amountAtomic || !transfer.blockHash || transfer.blockHeight === undefined)
        throw new Error('invalid_transfer');
      const valuation = await this.deps.value(config, transfer.amountAtomic, this.deps.now());
      const paymentID = paymentKey(config, order.direct.txid);
      await supportOrderModel.updateOne(match, {
        $set: {
          status: 'finished',
          paymentID,
          amountCents: valuation.amountCents,
          confirmedAt: this.deps.now(),
          'direct.amountAtomic': transfer.amountAtomic,
          'direct.blockHash': transfer.blockHash,
          'direct.blockHeight': transfer.blockHeight,
          'direct.usdRate': valuation.usdRate,
          'direct.rateSource': valuation.rateSource,
          'direct.valuedAt': valuation.valuedAt,
        },
        $unset: { ...release, 'direct.nextCheckAt': '' },
      });
    } catch (error) {
      if (duplicate(error)) await stop('duplicate');
      else await retry('provider_unavailable');
    }
    return true;
  }
  async reassign(orderId: string, expectedUserID: string, newUserID: string, reason: string): Promise<void> {
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 1000 || expectedUserID === newUserID)
      throw new Error('invalid_reason');
    if (!(await userProfileModel.exists({ id: newUserID }))) throw new Error('unknown_user');
    const result = await supportOrderModel.updateOne(
      { orderId, provider: 'direct', userID: expectedUserID, status: 'finished' },
      {
        $set: { userID: newUserID, anonymous: true },
        $push: {
          'direct.reassignments': { from: expectedUserID, to: newUserID, reason: reason.trim(), at: this.deps.now() },
        },
      },
    );
    if (!result.matchedCount) throw new Error('owner_changed');
  }
}
export const directSupport = new DirectService();
