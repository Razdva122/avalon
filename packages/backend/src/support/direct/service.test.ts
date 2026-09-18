import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { configuredNetworks } from './config';
import { DirectService } from './service';
import { supportOrderModel, supportTotalCents } from '../repository';
import { userProfileModel, userFeaturesModel } from '@/db/models';
import { hasPremium } from '../premium';
import { TransferResult } from './chains';

jest.setTimeout(120000);
let mongo: MongoMemoryServer;
let service: DirectService;
let time: number;
let result: TransferResult;
let checks: number;
let ready: boolean;
const networks = configuredNetworks({ SUPPORT_ETH_RPC_URL: 'https://eth.example' }).filter((n) => n.id === 'eth');
const txid = '0x' + 'ab'.repeat(32);
function makeService() {
  return new DirectService({
    networks: () => networks.map((n) => ({ ...n })),
    now: () => new Date(time),
    ready: async () => ready,
    read: async () => {
      checks++;
      return result;
    },
    value: async () => ({ amountCents: 1000, usdRate: '1', rateSource: 'fixed:USDT-USD', valuedAt: new Date(time) }),
  });
}
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await supportOrderModel.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  await Promise.all([
    supportOrderModel.deleteMany({}),
    userProfileModel.deleteMany({}),
    userFeaturesModel.deleteMany({}),
  ]);
  if (mongoose.connection.db) await mongoose.connection.db.collection('directsupportlimits').deleteMany({});
  time = Date.parse('2026-09-18T10:00:00Z');
  checks = 0;
  ready = true;
  result = { status: 'verified', amountAtomic: '10000000', blockHash: '0x' + 'cd'.repeat(32), blockHeight: 100 };
  service = makeService();
  await userProfileModel.collection.insertMany([
    { login: 'alice', email: 'alice@example.test', id: 'alice' },
    { login: 'bob', email: 'bob@example.test', id: 'bob' },
  ]);
});
test('submission credits actual verified amount once and returns same result on repeat', async () => {
  const order = await service.submit('alice', 'eth', txid, true);
  expect(order.status).toBe('finished');
  expect(await supportTotalCents('alice')).toBe(1000);
  expect((await service.submit('alice', 'eth', txid.toUpperCase(), false)).orderId).toBe(order.orderId);
  expect(checks).toBe(1);
  expect(await supportOrderModel.countDocuments()).toBe(1);
});
test('two independent services cannot credit the same transfer to two users', async () => {
  await Promise.allSettled([
    service.submit('alice', 'eth', txid, false),
    makeService().submit('bob', 'eth', txid, false),
  ]);
  expect(await supportOrderModel.countDocuments({ status: 'finished' })).toBe(1);
  expect((await supportTotalCents('alice')) + (await supportTotalCents('bob'))).toBe(1000);
});
test('malformed and unavailable networks create no claim and no reserved transfer', async () => {
  await expect(service.submit('alice', 'eth', 'bad', true)).rejects.toThrow('invalid_txid');
  ready = false;
  await expect(service.submit('alice', 'eth', txid, true)).rejects.toThrow('unavailable');
  expect(await supportOrderModel.countDocuments()).toBe(0);
});
test('pending claim reserves no global credit and worker survives a service restart', async () => {
  result = { status: 'confirming' };
  const first = await service.submit('alice', 'eth', txid, true);
  expect(first.paymentID).toBeUndefined();
  expect(await supportTotalCents('alice')).toBe(0);
  result = { status: 'verified', amountAtomic: '10000000', blockHash: '0x' + 'cd'.repeat(32), blockHeight: 100 };
  time += 120000;
  expect(await makeService().processOne()).toBe(true);
  expect(await supportTotalCents('alice')).toBe(1000);
});
test('pending claim from one account does not prevent another from completing the payment', async () => {
  result = { status: 'waiting' };
  const alice = await service.submit('alice', 'eth', txid, true);
  result = { status: 'verified', amountAtomic: '10000000', blockHash: '0x' + 'cd'.repeat(32), blockHeight: 100 };
  await service.submit('bob', 'eth', txid, true);
  time += 120000;
  await service.processOne();
  expect((await supportOrderModel.findOne({ orderId: alice.orderId }))!.status).toBe('duplicate');
  expect(await supportTotalCents('bob')).toBe(1000);
  expect(await supportTotalCents('alice')).toBe(0);
});
test('provider failure stays retryable, one-hour timeout can be refreshed manually', async () => {
  service = new DirectService({
    networks: () => networks,
    now: () => new Date(time),
    ready: async () => true,
    read: async () => {
      throw Error('offline');
    },
  });
  const order = await service.submit('alice', 'eth', txid, true);
  expect(order.status).toBe('provider_unavailable');
  time += 59 * 60000;
  await service.processOne();
  const pending = (await supportOrderModel.findOne({ orderId: order.orderId }))!;
  expect(pending.status).toBe('provider_unavailable');
  expect(pending.direct!.nextCheckAt!.getTime()).toBeLessThanOrEqual(order.createdAt.getTime() + 3600000);
  time += 60000;
  await service.processOne();
  expect((await supportOrderModel.findOne({ orderId: order.orderId }))!.status).toBe('check_expired');
  await makeService().refresh(order.orderId, 'alice');
  expect(await supportTotalCents('alice')).toBe(1000);
});
test('unfinished lease prevents concurrent work and expired lease can be recovered', async () => {
  result = { status: 'waiting' };
  const order = await service.submit('alice', 'eth', txid, true);
  time += 120000;
  await supportOrderModel.updateOne(
    { orderId: order.orderId },
    { $set: { 'direct.leaseToken': 'dead-worker', 'direct.leaseUntil': new Date(time + 10000) } },
  );
  expect(await service.processOne()).toBe(false);
  time += 11000;
  expect(await service.processOne()).toBe(true);
});
test('same account concurrent submissions are idempotent and new claims are throttled', async () => {
  const attempts = await Promise.allSettled(
    Array.from({ length: 5 }, () => service.submit('alice', 'eth', txid, true)),
  );
  expect(attempts.some((r) => r.status === 'fulfilled')).toBe(true);
  expect(await supportOrderModel.countDocuments()).toBe(1);
  await expect(service.submit('alice', 'eth', '0x' + 'ef'.repeat(32), true)).rejects.toThrow('too_many_requests');
});
test('reassignment updates both totals and audit atomically, without changing manual Premium', async () => {
  const order = await service.submit('alice', 'eth', txid, false);
  const grant = new Date(time);
  await userFeaturesModel.collection.insertOne({ userID: 'alice', premiumGrantedAt: grant });
  await service.reassign(order.orderId, 'alice', 'bob', 'Owner checked the dispute');
  expect(await supportTotalCents('alice')).toBe(0);
  expect(await supportTotalCents('bob')).toBe(1000);
  expect(hasPremium(0, await userFeaturesModel.findOne({ userID: 'alice' }).lean())).toBe(true);
  const moved = await supportOrderModel.findOne({ orderId: order.orderId }).lean();
  expect(moved).toMatchObject({ userID: 'bob', anonymous: true, paymentID: order.paymentID, amountCents: 1000 });
  expect(moved!.direct!.reassignments).toHaveLength(1);
  await expect(service.reassign(order.orderId, 'alice', 'bob', 'repeat')).rejects.toThrow('owner_changed');
  expect(await supportOrderModel.countDocuments()).toBe(1);
  expect((await service.submit('bob', 'eth', txid, false)).orderId).toBe(order.orderId);
  await expect(service.submit('alice', 'eth', txid, false)).rejects.toThrow('already_claimed');
});
test('reassignment requires existing destination, reason and original owner', async () => {
  const order = await service.submit('alice', 'eth', txid, false);
  await expect(service.reassign(order.orderId, 'alice', 'nobody', 'reason')).rejects.toThrow('unknown_user');
  await expect(service.reassign(order.orderId, 'alice', 'bob', ' ')).rejects.toThrow('invalid_reason');
  expect(await supportTotalCents('alice')).toBe(1000);
});
test('owner refresh cannot touch another account or revalue an already finished payment', async () => {
  const order = await service.submit('alice', 'eth', txid, true);
  await expect(service.refresh(order.orderId, 'bob')).rejects.toThrow('not_found');
  expect((await service.refresh(order.orderId, 'alice')).status).toBe('finished');
  expect(checks).toBe(1);
});

test('an unavailable price saves no credit and a later retry fixes the amount once', async () => {
  const failing = new DirectService({
    networks: () => networks,
    now: () => new Date(time),
    ready: async () => true,
    read: async () => result,
    value: async () => {
      throw new Error('invalid_rate');
    },
  });
  const order = await failing.submit('alice', 'eth', txid, true);
  expect(order.status).toBe('provider_unavailable');
  expect(order.paymentID).toBeUndefined();
  expect(await supportTotalCents('alice')).toBe(0);
  time += 120000;
  await service.processOne();
  expect(await supportTotalCents('alice')).toBe(1000);
  const complete = await supportOrderModel.findOne({ orderId: order.orderId }).lean();
  expect(complete!.direct!.usdRate).toBe('1');
  time += 120000;
  expect(await service.processOne()).toBe(false);
});

test('retry verifies the saved recipient even after operator changes the receiving address', async () => {
  result = { status: 'confirming' };
  const order = await service.submit('alice', 'eth', txid, true);
  const originalAddress = networks[0].address;
  let verifiedAddress = '';
  const restarted = new DirectService({
    networks: () => [{ ...networks[0], address: '0x' + 'ee'.repeat(20) }],
    ready: async () => true,
    now: () => new Date(time),
    read: async (config) => {
      verifiedAddress = config.address;
      return { status: 'waiting' };
    },
  });
  time += 120000;
  await restarted.processOne();
  expect(verifiedAddress).toBe(originalAddress);
  expect((await supportOrderModel.findOne({ orderId: order.orderId }).lean())!.direct!.address).toBe(originalAddress);
});
