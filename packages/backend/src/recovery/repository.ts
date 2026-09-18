import { mongo } from 'mongoose';
import { randomUUID } from 'crypto';

export interface ResetToken {
  hash: string;
  email: string;
  expiresAt: Date;
}
export interface MailJob {
  id: string;
  kind: 'reset' | 'changed';
  payload: string;
  tokenHash?: string;
  expiresAt: Date;
  availableAt: Date;
  attempts: number;
  state: 'pending' | 'sending';
  lease?: string;
  leaseUntil?: Date;
}
export interface RecoveryAccount {
  id: string;
  email: string;
  password: string;
  authVersion?: number;
  recoveryTokens?: ResetToken[];
  mailQueue?: MailJob[];
}
interface Counter {
  _id: string;
  times: Date[];
  expiresAt: Date;
}
interface Suppression {
  _id: string;
  reason: string;
  createdAt: Date;
}

export class MongoRecoveryRepository {
  readonly users: mongo.Collection<RecoveryAccount>;
  private counters: mongo.Collection<Counter>;
  private suppressions: mongo.Collection<Suppression>;
  constructor(db: mongo.Db, collection: string) {
    this.users = db.collection<RecoveryAccount>(collection);
    this.counters = db.collection<Counter>('mailRateLimits');
    this.suppressions = db.collection<Suppression>('mailSuppressions');
  }
  async init() {
    await Promise.all([
      this.counters.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.users.createIndex({ 'recoveryTokens.hash': 1 }, { sparse: true }),
      this.users.createIndex({ 'mailQueue.availableAt': 1 }, { sparse: true }),
    ]);
  }
  async take(key: string, limits: { count: number; ms: number }[], now: Date): Promise<boolean> {
    const maxWindow = Math.max(...limits.map((l) => l.ms));
    const fresh = (ms: number) => ({
      $filter: { input: { $ifNull: ['$times', []] }, as: 't', cond: { $gt: ['$$t', new Date(+now - ms)] } },
    });
    try {
      await this.counters.updateOne(
        { _id: key },
        { $setOnInsert: { times: [], expiresAt: new Date(+now + maxWindow) } },
        { upsert: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    const result = await this.counters.updateOne(
      { _id: key, $expr: { $and: limits.map((limit) => ({ $lt: [{ $size: fresh(limit.ms) }, limit.count] })) } },
      [{ $set: { times: { $concatArrays: [fresh(maxWindow), [now]] }, expiresAt: new Date(+now + maxWindow) } }],
    );
    return result.modifiedCount === 1;
  }
  async suppressed(key: string) {
    return !!(await this.suppressions.findOne({ _id: key }));
  }
  async suppress(key: string, reason: string, now: Date) {
    await this.suppressions.updateOne({ _id: key }, { $set: { reason, createdAt: now } }, { upsert: true });
  }
  async enqueue(user: RecoveryAccount, token: ResetToken, job: MailJob) {
    return this.users.updateOne(
      {
        id: user.id,
        email: user.email,
        password: user.password,
        $expr: { $lt: [{ $size: { $ifNull: ['$mailQueue', []] } }, 10] },
      },
      { $push: { recoveryTokens: { $each: [token], $slice: -5 }, mailQueue: job } },
    );
  }
  async consume(hash: string, password: string, job: MailJob, now: Date) {
    // The token's destination must still match the account's current email.
    return this.users.findOneAndUpdate(
      {
        recoveryTokens: { $elemMatch: { hash, expiresAt: { $gt: now } } },
        $expr: {
          $anyElementTrue: {
            $map: {
              input: { $ifNull: ['$recoveryTokens', []] },
              as: 't',
              in: { $and: [{ $eq: ['$$t.hash', hash] }, { $eq: ['$$t.email', '$email'] }] },
            },
          },
        },
      },
      { $set: { password, recoveryTokens: [] }, $inc: { authVersion: 1 }, $push: { mailQueue: job } },
      { returnDocument: 'after' },
    );
  }
  async claim(now: Date): Promise<{ user: RecoveryAccount; job: MailJob } | null> {
    const lease = randomUUID();
    const user = await this.users.findOneAndUpdate(
      { mailQueue: { $elemMatch: { state: 'pending', availableAt: { $lte: now }, expiresAt: { $gt: now } } } },
      {
        $set: {
          'mailQueue.$.state': 'sending',
          'mailQueue.$.lease': lease,
          'mailQueue.$.leaseUntil': new Date(+now + 120000),
        },
      },
      { returnDocument: 'after' },
    );
    if (!user) return null;
    return { user, job: user.mailQueue!.find((job) => job.lease === lease)! };
  }
  async attempt(userID: string, job: MailJob): Promise<boolean> {
    const result = await this.users.updateOne(
      { id: userID, mailQueue: { $elemMatch: { id: job.id, lease: job.lease, state: 'sending' } } },
      { $inc: { 'mailQueue.$.attempts': 1 } },
    );
    return result.modifiedCount === 1;
  }
  async finish(userID: string, job: MailJob, retryAt?: Date) {
    if (retryAt) {
      await this.users.updateOne(
        { id: userID, mailQueue: { $elemMatch: { id: job.id, lease: job.lease } } },
        { $set: { 'mailQueue.$.state': 'pending', 'mailQueue.$.availableAt': retryAt } },
      );
    } else {
      await this.users.updateOne({ id: userID }, { $pull: { mailQueue: { id: job.id, lease: job.lease } } });
    }
  }
  async cleanup(now: Date) {
    // A worker that died during SMTP has an ambiguous delivery result: do not resend.
    await this.users.updateMany(
      { 'mailQueue.0': { $exists: true } },
      {
        $pull: {
          mailQueue: {
            $or: [{ expiresAt: { $lte: now } }, { state: 'sending', leaseUntil: { $lte: now } }],
          },
        },
      },
    );
    await this.users.updateMany(
      { 'recoveryTokens.0': { $exists: true } },
      { $pull: { recoveryTokens: { expiresAt: { $lte: now } } } },
    );
  }
}
