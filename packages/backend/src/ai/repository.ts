import { aiPlayedModel, aiRosterInfo } from '@avalon/types';
import { AI_LEASE_MS } from './timing';
import { calculateAiRatings } from './ratings';
import { AI_PROFILE_RATING_SEASON } from './rating-season';
import type { Db } from 'mongodb';
import type { StartedRoomState, TRoomState, TRoomInfo, PlayerGameSummaryPage, BotQuotaThresholds } from '@avalon/types';
import { defaultBotQuotaThresholds, validBotQuotaThresholds } from './quota-policy';
import { AiPause } from './client';
import { quotaSpent, weeklyUsagePeriod, type WeeklyUsagePeriod } from './usage-stats';
import type { AiGameUsage, AiAccountUsage, CodexWeeklyLimit, CodexSettings } from '@avalon/types';

type GameUsageRecord = Omit<
  AiGameUsage,
  | 'settings'
  | 'inputTokens'
  | 'cachedTokens'
  | 'outputTokens'
  | 'reasoningTokens'
  | 'requests'
  | 'unknownUsageRequests'
  | 'weeklySpent'
  | 'shortTermSpent'
> & {
  _id: string;
  expiresAt: Date;
  before: CodexWeeklyLimit | null;
  after?: CodexWeeklyLimit | null;
  sharedQuota?: boolean;
};

export type AiRequestLog = {
  _id: string;
  roomID: string;
  player: string;
  stage: string;
  mode: string;
  startedAt: Date;
  finishedAt?: Date;
  status: string;
  inputBytes?: number;
  submittedInputBytes?: number;
  inputTokens?: number;
  cachedTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  model?: string;
  reasoning?: string;
  phase?: string;
  attempts?: number;
  unknownUsageAttempts?: number;
  failureKind?: string;
};

export type AiDecisionTrace = {
  admitEvil?: boolean;
  exposedStrategy?: import('./exposed-evil').ExposedEvilPlan | null;
  strategyChangeReason?: string;
  _id: string;
  roomID: string;
  player: string;
  stage: string;
  createdAt: Date;
  payload: Record<string, unknown>;
  memoryBefore?: string;
  memoryAfter?: string;
  choice?: string;
  speech?: string;
  publicReason?: string;
  evidence?: import('./client').DecisionEvidence[];
  responseID?: string;
  output?: unknown;
};

type Ledger = { _id: string; owner?: string; leaseUntil?: Date };
function validateID(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Invalid ID');
}

type ArchiveSummary = Pick<
  StartedRoomState,
  'roomID' | 'ai' | 'stage' | 'leaderID' | 'players' | 'options' | 'createAt' | 'startAt'
> & { game: Pick<StartedRoomState['game'], 'result'> };

export class AiRepository {
  private async observeWeeklyQuota(
    instanceID: string,
    quota: CodexWeeklyLimit | null,
  ): Promise<WeeklyUsagePeriod | null> {
    const periods = this.db.collection<WeeklyUsagePeriod & { _id: string }>('ai_account_usage_periods');
    for (;;) {
      const previous = await periods.findOne({ _id: instanceID });
      let baseline: WeeklyUsagePeriod | null = previous;
      if (!previous && quota) {
        // Bootstrap only from recorded observations, never an assumed seven-day start.
        const history = await this.db
          .collection<GameUsageRecord>('ai_game_usage')
          .find({ instanceID }, { projection: { before: 1, after: 1 }, maxTimeMS: 10000 })
          .toArray();
        const snapshots = history
          .flatMap((game) => [game.before, game.after])
          .filter((snapshot): snapshot is CodexWeeklyLimit =>
            Boolean(snapshot && snapshot.checkedAt <= quota.checkedAt),
          )
          .sort((a, b) => a.checkedAt - b.checkedAt);
        for (const snapshot of snapshots) baseline = weeklyUsagePeriod(baseline, snapshot);
      }
      const next = weeklyUsagePeriod(baseline, quota);
      if (!next || next === previous) return next;
      if (previous) {
        const updated = await periods.updateOne({ _id: instanceID, checkedAt: previous.checkedAt }, { $set: next });
        if (updated.matchedCount) return next;
      } else {
        try {
          await periods.insertOne({ _id: instanceID, ...next });
          return next;
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
        }
      }
      // Another process advanced the snapshot. Re-read instead of rolling it back.
    }
  }
  async weeklyAccountUsage(
    accounts: { id: string; quota: CodexWeeklyLimit | null }[],
    now = Date.now(),
  ): Promise<AiAccountUsage[]> {
    return Promise.all(
      accounts.map(async ({ id, quota }) => {
        const period = await this.observeWeeklyQuota(id, quota);
        const reset = period?.resetsAt;
        const result: AiAccountUsage = {
          instanceID: id,
          tokens: reset ? 0 : null,
          gameCount: 0,
          weeklySpent: reset ? 0 : null,
          shortTermSpent: reset ? 0 : null,
          weeklyIncomplete: false,
          shortTermIncomplete: false,
        };
        if (!period) return result;
        const start = new Date(period.startedAt);
        const games = await this.db
          .collection<GameUsageRecord>('ai_game_usage')
          .find(
            { instanceID: id, expiresAt: { $gt: new Date(now) } },
            { projection: { _id: 1, before: 1, after: 1, sharedQuota: 1 }, maxTimeMS: 10000 },
          )
          .toArray();
        if (!games.length) return result;
        const costs = await this.db
          .collection<AiRequestLog>('ai_request_costs')
          .aggregate<{
            _id: string;
            tokens: number;
          }>(
            [
              {
                $match: {
                  roomID: { $in: games.map((game) => game._id) },
                  startedAt: { $gte: start, $lte: new Date(now) },
                  phase: { $ne: 'beginner-review' },
                },
              },
              {
                $group: {
                  _id: '$roomID',
                  tokens: { $sum: { $add: [{ $ifNull: ['$inputTokens', 0] }, { $ifNull: ['$outputTokens', 0] }] } },
                },
              },
            ],
            { maxTimeMS: 10000 },
          )
          .toArray();
        result.tokens = costs.reduce((sum, cost) => sum + cost.tokens, 0);
        result.gameCount = costs.length;
        const included = new Set(costs.map((cost) => cost._id));
        const currentGames = games.filter((game) => included.has(game._id));
        for (const [key, incomplete, shortTerm] of [
          ['weeklySpent', 'weeklyIncomplete', false],
          ['shortTermSpent', 'shortTermIncomplete', true],
        ] as const) {
          const values = currentGames.map((game) =>
            !game.sharedQuota &&
            game.before &&
            game.before.resetsAt === reset &&
            game.before.checkedAt >= period.startedAt
              ? quotaSpent(
                  shortTerm ? game.before?.shortTerm : game.before,
                  shortTerm ? game.after?.shortTerm : game.after,
                )
              : null,
          );
          const known = values.filter((value): value is number => value !== null);
          result[key] = currentGames.length && !known.length ? null : known.reduce((sum, value) => sum + value, 0);
          result[incomplete] = known.length < values.length;
        }
        return result;
      }),
    );
  }
  async getBotQuotaThresholds(): Promise<BotQuotaThresholds> {
    const settings = await this.db
      .collection<{ _id: string; thresholds: BotQuotaThresholds }>('ai_settings')
      .findOne({ _id: 'bot-quota-thresholds' });
    if (!settings) return structuredClone(defaultBotQuotaThresholds);
    if (!validBotQuotaThresholds(settings.thresholds)) throw Error('Invalid bot quota thresholds');
    return settings.thresholds;
  }
  async setBotQuotaThresholds(thresholds: BotQuotaThresholds) {
    if (!validBotQuotaThresholds(thresholds)) throw Error('Invalid bot quota thresholds');
    await this.db
      .collection<{ _id: string; thresholds: BotQuotaThresholds }>('ai_settings')
      .updateOne({ _id: 'bot-quota-thresholds' }, { $set: { thresholds } }, { upsert: true });
  }
  async startGameUsage(state: StartedRoomState, instanceID: string, before: CodexWeeklyLimit | null) {
    await this.observeWeeklyQuota(instanceID, before);
    const startedAt = Date.now();
    const humanCount = state.ai?.humanPlayerIDs?.length ?? (state.ai?.humanPlayerID ? 1 : 0);
    const created = await this.db.collection<GameUsageRecord>('ai_game_usage').updateOne(
      { _id: state.roomID },
      {
        $setOnInsert: {
          roomID: state.roomID,
          instanceID,
          startedAt,
          expiresAt: this.retentionDate(new Date(startedAt), 'AI_REQUEST_RETENTION_DAYS', 365),
          before,
          status: state.ai?.status ?? 'running',
          humanCount,
          botCount: state.players.length - humanCount,
          mode: state.ai?.beginner ? 'beginner' : (state.ai?.botDifficulty ?? 'custom'),
          language: state.ai?.language,
          options: state.options,
        },
      },
      { upsert: true },
    );
    if (created.upsertedCount) {
      // Subscription snapshots include all concurrent games; never attribute the same spend twice.
      const liveSiblings = (await this.busyInstances())
        .filter((lease) => lease.instanceID === instanceID && lease.roomID !== state.roomID)
        .map((lease) => lease.roomID);
      const siblings = await this.db
        .collection<GameUsageRecord>('ai_game_usage')
        .find(
          {
            instanceID,
            _id: { $ne: state.roomID },
            $or: [{ _id: { $in: liveSiblings } }, { checkedAt: { $gte: startedAt } }],
          },
          { projection: { _id: 1 }, maxTimeMS: 10000 },
        )
        .toArray();
      if (siblings.length)
        await this.db
          .collection<GameUsageRecord>('ai_game_usage')
          .updateMany(
            { _id: { $in: [state.roomID, ...siblings.map(({ _id }) => _id)] } },
            { $set: { sharedQuota: true } },
          );
    }
  }
  async finishGameUsage(roomID: string, after: CodexWeeklyLimit | null) {
    const game = await this.db
      .collection<GameUsageRecord>('ai_game_usage')
      .findOne({ _id: roomID }, { projection: { instanceID: 1 } });
    if (game) await this.observeWeeklyQuota(game.instanceID, after);
    await this.db
      .collection<GameUsageRecord>('ai_game_usage')
      .updateOne({ _id: roomID }, { $set: { after, checkedAt: Date.now() } });
  }
  async recentGameUsage(): Promise<AiGameUsage[]> {
    await this.ensureRetentionIndexes();
    const records = await this.db
      .collection<GameUsageRecord>('ai_game_usage')
      .find({ expiresAt: { $gt: new Date() } }, { maxTimeMS: 10000 })
      .sort({ startedAt: -1 })
      .limit(50)
      .toArray();
    if (!records.length) return [];
    const costs = await this.db
      .collection<AiRequestLog>('ai_request_costs')
      .aggregate<{
        _id: string;
        inputTokens: number;
        cachedTokens: number;
        outputTokens: number;
        reasoningTokens: number;
        requests: number;
        unknownUsageRequests: number;
        settings: CodexSettings[];
      }>(
        [
          { $match: { roomID: { $in: records.map((r) => r.roomID) }, phase: { $ne: 'beginner-review' } } },
          {
            $group: {
              _id: '$roomID',
              inputTokens: { $sum: '$inputTokens' },
              cachedTokens: { $sum: '$cachedTokens' },
              outputTokens: { $sum: '$outputTokens' },
              reasoningTokens: { $sum: '$reasoningTokens' },
              requests: { $sum: 1 },
              unknownUsageRequests: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: [{ $ifNull: ['$inputTokens', null] }, null] },
                        { $eq: [{ $ifNull: ['$outputTokens', null] }, null] },
                        { $gt: ['$unknownUsageAttempts', 0] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              settings: { $addToSet: { model: '$model', reasoning: '$reasoning' } },
            },
          },
        ],
        { maxTimeMS: 10000 },
      )
      .toArray();
    return records.map(({ _id, before, after, expiresAt, sharedQuota, ...record }) => {
      void expiresAt; // Storage retention metadata is never sent to clients.
      const cost = costs.find((entry) => entry._id === _id);
      return {
        ...record,
        settings: cost?.settings ?? [],
        requests: cost?.requests ?? 0,
        inputTokens: cost?.inputTokens ?? 0,
        cachedTokens: cost?.cachedTokens ?? 0,
        outputTokens: cost?.outputTokens ?? 0,
        reasoningTokens: cost?.reasoningTokens ?? 0,
        unknownUsageRequests: cost?.unknownUsageRequests ?? 1,
        weeklySpent: sharedQuota ? null : quotaSpent(before, after),
        shortTermSpent: sharedQuota ? null : quotaSpent(before?.shortTerm, after?.shortTerm),
      };
    });
  }
  private achievementProcessing?: Promise<void>;
  private ratingCache?: { version: number; expires: number; ratings: ReturnType<typeof calculateAiRatings> };
  private ratingPending?: Promise<ReturnType<typeof calculateAiRatings>>;
  private listCache?: { value: TRoomInfo[]; expires: number };
  private listPending?: Promise<TRoomInfo[]>;
  private listVersion = 0;
  private indexes?: Promise<unknown>;
  private retentionIndexes?: Promise<unknown>;

  constructor(private db: Db) {}
  private retentionDate(start: Date, variable: string, fallback: number) {
    const days = Number(process.env[variable] ?? fallback);
    if (!Number.isSafeInteger(days) || days < 1 || days > 36500) throw new Error(`Invalid ${variable}`);
    return new Date(start.getTime() + days * 86400000);
  }
  private async ensureRetentionIndexes() {
    if (!this.retentionIndexes)
      this.retentionIndexes = Promise.all([
        this.db.collection('ai_game_usage').createIndex({ startedAt: -1 }),
        this.db.collection('ai_game_usage').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        this.db.collection('ai_request_costs').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        this.db.collection('ai_request_costs').createIndex({ roomID: 1, startedAt: 1 }),
        this.db.collection('ai_decision_traces').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]).catch((error) => {
        this.retentionIndexes = undefined;
        throw error;
      });
    await this.retentionIndexes;
  }
  async recordRequest(entry: AiRequestLog) {
    const expiresAt =
      entry.finishedAt !== undefined
        ? this.retentionDate(entry.startedAt, 'AI_REQUEST_RETENTION_DAYS', 365)
        : undefined;
    await this.ensureRetentionIndexes();
    await this.db
      .collection<AiRequestLog>('ai_request_costs')
      .updateOne({ _id: entry._id }, { $set: { ...entry, ...(expiresAt ? { expiresAt } : {}) } }, { upsert: true });
  }
  // Server-only diagnostics: never included in public room states or replays.
  async recordDecision(entry: AiDecisionTrace) {
    const expiresAt = this.retentionDate(entry.createdAt, 'AI_TRACE_RETENTION_DAYS', 30);
    await this.ensureRetentionIndexes();
    await this.db
      .collection<AiDecisionTrace>('ai_decision_traces')
      .updateOne({ _id: entry._id }, { $set: { ...entry, expiresAt } }, { upsert: true });
  }
  // Keep the existing lock document so upgrades cannot overlap an older running room.
  private get ledgerID() {
    return process.env.NODE_ENV === 'production' ? 'avalon-ai-production-v1' : 'avalon-ai-v1';
  }
  private get ledger() {
    return this.db.collection<Ledger>('ai_experiment_budget');
  }
  private instanceLedgerID(instanceID = 'default') {
    validateID(instanceID);
    return instanceID === 'default' ? this.ledgerID : `${this.ledgerID}:${instanceID}`;
  }
  private get leaseFilter() {
    return { $regex: `^${this.ledgerID}(?::[a-zA-Z0-9-]+)?(?::slot2)?$` };
  }
  async busyInstances(): Promise<{ instanceID: string; roomID: string }[]> {
    const leases = await this.ledger
      .find({ _id: this.leaseFilter, owner: { $exists: true }, leaseUntil: { $gt: new Date() } })
      .toArray();
    return leases.map((lease) => ({
      instanceID: lease._id === this.ledgerID ? 'default' : lease._id.slice(this.ledgerID.length + 1).split(':')[0],
      roomID: lease.owner!,
    }));
  }
  async claim(roomID: string, instanceID = 'default', maxGames: 1 | 2 = 1) {
    validateID(roomID);
    if (![1, 2].includes(maxGames) || (instanceID === 'default' && maxGames !== 1))
      throw new Error('Invalid AI account capacity');
    const ledgerID = this.instanceLedgerID(instanceID);
    const slots = maxGames === 2 ? [ledgerID, `${ledgerID}:slot2`] : [ledgerID];
    // Starting/resuming an already reserved room must retain its original slot.
    const existing = await this.ledger.findOneAndUpdate(
      { _id: { $in: slots }, owner: roomID, leaseUntil: { $gt: new Date() } },
      { $set: { leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
      { returnDocument: 'before' },
    );
    if (existing) return;
    for (const slot of slots) {
      // Concurrent first claims can race while creating the same lock document.
      try {
        await this.ledger.updateOne({ _id: slot }, { $setOnInsert: { _id: slot } }, { upsert: true });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      const previous = await this.ledger.findOneAndUpdate(
        {
          _id: slot,
          $or: [{ owner: { $exists: false } }, { leaseUntil: { $lt: new Date() } }, { owner: roomID }],
        },
        { $set: { owner: roomID, leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
        { returnDocument: 'before' },
      );
      if (previous) return;
    }
    throw new AiPause('Другая AI-партия уже запущена.');
  }
  async release(roomID: string) {
    validateID(roomID);
    await this.ledger.updateOne({ _id: this.leaseFilter, owner: roomID }, { $unset: { owner: '', leaseUntil: '' } });
  }
  async renewLease(roomID: string) {
    validateID(roomID);
    const result = await this.ledger.updateOne(
      { _id: this.leaseFilter, owner: roomID, leaseUntil: { $gt: new Date() } },
      { $set: { leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
    );
    if (!result.matchedCount) throw new AiPause('Потеряно управление AI-партией.');
  }
  async save(state: TRoomState) {
    // Separate collection keeps AI replays out of all existing ranked statistics queries.
    if (state.stage !== 'started') return;
    validateID(state.roomID);
    await this.db
      .collection<GameUsageRecord>('ai_game_usage')
      .updateOne({ _id: state.roomID }, { $set: { status: state.ai?.status ?? 'stopped' } });
    const saved = structuredClone(state);
    saved.createAt = new Date(saved.createAt).toISOString();
    await this.db.collection<{ _id: string; state: StartedRoomState }>('ai_room_replays').updateOne(
      { _id: state.roomID },
      {
        $set: {
          state: saved,
          ...(saved.ai?.humanPlayerID &&
          saved.game.stage === 'end' &&
          saved.game.result?.winner &&
          saved.game.result.reason !== 'manualy'
            ? { aiAchievementPending: true }
            : {}),
        },
      },
      { upsert: true },
    );
    this.listVersion++;
    this.listCache = undefined;
  }
  /** Retry durably saved award work, including after a server restart. */
  processPendingAchievements(handler: (state: StartedRoomState) => Promise<void>): Promise<void> {
    if (this.achievementProcessing) return this.achievementProcessing;
    this.achievementProcessing = (async () => {
      const collection = this.db.collection<{ _id: string; state: StartedRoomState; aiAchievementPending?: boolean }>(
        'ai_room_replays',
      );
      const pending = await collection.find({ aiAchievementPending: true }).limit(20).maxTimeMS(10000).toArray();
      for (const entry of pending) {
        await handler(entry.state);
        await collection.updateOne({ _id: entry._id }, { $unset: { aiAchievementPending: '' } });
      }
    })().finally(() => {
      this.achievementProcessing = undefined;
    });
    return this.achievementProcessing;
  }

  /** Completed AI games remain isolated from human history and rating collections. */
  async getPlayerGameSummariesPage(playerID: string, cursor?: string | null): Promise<PlayerGameSummaryPage> {
    validateID(playerID);
    const collection = this.db.collection<{ _id: string; state: StartedRoomState }>('ai_room_replays');
    const filter = {
      'state.players.id': playerID,
      'state.game.stage': 'end',
      'state.game.result.winner': { $in: ['good', 'evil'] },
      'state.game.result.reason': { $ne: 'manualy' },
    };
    let afterID: string | undefined;
    let upperID: string;
    if (cursor != null) {
      if (typeof cursor !== 'string' || !/^ai:[a-zA-Z0-9_-]{1,600}$/.test(cursor))
        throw Error('Invalid history cursor');
      const parsed = JSON.parse(Buffer.from(cursor.slice(3), 'base64url').toString('utf8'));
      if (!Array.isArray(parsed) || parsed.length !== 2) throw Error('Invalid history cursor');
      [afterID, upperID] = parsed;
      validateID(afterID);
      validateID(upperID);
    } else {
      const newest = await collection
        .find(filter, { projection: { _id: 1 }, maxTimeMS: 10000 })
        .sort({ _id: -1 })
        .limit(1)
        .next();
      if (!newest) return { games: [] };
      upperID = newest._id;
    }
    // UUID ordering gives a stable cursor regardless of legacy date formats.
    // The client orders the complete summary set by parsed startAt for recent games.
    const docs = await collection
      .find(
        { ...filter, _id: { $lte: upperID, ...(afterID ? { $gt: afterID } : {}) } },
        {
          projection: {
            _id: 1,
            'state.startAt': 1,
            'state.createAt': 1,
            'state.game.uuid': 1,
            'state.game.players.id': 1,
            'state.game.players.role': 1,
            'state.game.result.winner': 1,
          },
          maxTimeMS: 10000,
        },
      )
      .sort({ _id: 1 })
      .limit(201)
      .toArray();
    const visible = docs.slice(0, 200);
    return {
      games: visible.map(({ state }) => ({ ...state.game, startAt: state.startAt || state.createAt })),
      ...(docs.length > 200
        ? { nextCursor: 'ai:' + Buffer.from(JSON.stringify([visible[199]._id, upperID])).toString('base64url') }
        : {}),
    };
  }
  async getProfileRating(playerID: string) {
    validateID(playerID);
    if (this.ratingCache?.version === this.listVersion && this.ratingCache.expires > Date.now())
      return this.ratingCache.ratings.get(playerID);
    if (!this.ratingPending) {
      const version = this.listVersion;
      this.ratingPending = this.db
        .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
        .find(
          {
            'state.game.stage': 'end',
            'state.ai.profileRatingSeason': AI_PROFILE_RATING_SEASON,
            'state.game.result.winner': { $in: ['good', 'evil'] },
            'state.game.result.reason': { $ne: 'manualy' },
          },
          {
            projection: {
              'state.createAt': 1,
              'state.startAt': 1,
              'state.game.uuid': 1,
              'state.game.players.id': 1,
              'state.game.players.role': 1,
              'state.game.result.winner': 1,
            },
            maxTimeMS: 10000,
          },
        )
        .toArray()
        .then((docs) => {
          const ratings = calculateAiRatings(
            docs.map(({ state }) => ({ ...state.game, startAt: state.startAt || state.createAt })),
          );
          if (version === this.listVersion) this.ratingCache = { version, expires: Date.now() + 15000, ratings };
          return ratings;
        })
        .finally(() => {
          this.ratingPending = undefined;
        });
    }
    return (await this.ratingPending).get(playerID);
  }
  async recentSummaries(): Promise<TRoomInfo[]> {
    if (this.listCache && this.listCache.expires > Date.now()) return this.listCache.value;
    if (this.listPending) return this.listPending;
    const version = this.listVersion;
    const pending = this.readSummaries().then((value) => {
      if (version === this.listVersion) this.listCache = { value, expires: Date.now() + 15000 };
      return value;
    });
    this.listPending = pending;
    try {
      return await pending;
    } finally {
      if (this.listPending === pending) this.listPending = undefined;
    }
  }
  private async readSummaries(): Promise<TRoomInfo[]> {
    if (!this.indexes)
      this.indexes = Promise.all([
        this.db.collection('ai_room_replays').createIndex({ 'state.createAt': -1 }),
        this.db.collection('ai_decision_traces').createIndex({ roomID: 1 }),
      ]).catch((error) => {
        this.indexes = undefined;
        throw error;
      });
    await this.indexes;
    const docs = await this.db
      .collection<{ state: ArchiveSummary }>('ai_room_replays')
      .find(
        { 'state.ai.status': { $nin: ['stopped', 'running', 'paused'] } },
        {
          projection: {
            _id: 0,
            'state.roomID': 1,
            'state.ai': 1,
            'state.stage': 1,
            'state.leaderID': 1,
            'state.players.id': 1,
            'state.options': 1,
            'state.createAt': 1,
            'state.startAt': 1,
            'state.game.result': 1,
          },
          maxTimeMS: 10000,
        },
      )
      .sort({ 'state.createAt': -1 })
      .limit(20)
      .toArray();
    const states = await this.restoreModels(docs.map(({ state }) => this.archiveState(state)));
    return states
      .filter((state) => state.ai && state.ai.status !== 'stopped')
      .map((state) => ({
        uuid: state.roomID,
        ai: true,
        aiStatus: state.ai?.status,
        aiModel: aiPlayedModel(state.ai),
        aiTitle: state.ai?.title,
        ...aiRosterInfo(state.ai, state.players.length),
        aiBeginner: state.ai?.beginner,
        aiBotDifficulty: state.ai?.botDifficulty,
        aiLanguage: state.ai?.language ?? 'en',
        hostID: state.leaderID,
        state: state.stage,
        players: state.players.length,
        options: state.options,
        createAt: state.createAt,
        startAt: state.startAt,
        result: state.game?.result,
      }));
  }
  async recent(limit: number): Promise<StartedRoomState[]> {
    const docs = await this.db
      .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
      .find({})
      .sort({ 'state.createAt': -1 })
      .limit(limit)
      .toArray();
    return this.restoreModels(docs.map(({ state }) => this.archiveState(state)));
  }
  private async restoreModels<T extends Pick<StartedRoomState, 'roomID' | 'ai'>>(states: T[]): Promise<T[]> {
    const ids = states
      .filter(
        (state) => state.ai && (!state.ai.model || (state.ai.model === 'codex-chatgpt' && !aiPlayedModel(state.ai))),
      )
      .map((state) => state.roomID);
    if (!ids.length) return states;
    const records = await this.db
      .collection<AiDecisionTrace>('ai_decision_traces')
      .aggregate<{ _id: string; models: string[] }>([
        { $match: { roomID: { $in: ids }, 'payload.model': { $type: 'string' } } },
        { $group: { _id: '$roomID', models: { $addToSet: '$payload.model' } } },
      ])
      .toArray();
    for (const state of states) {
      if (!state.ai || !ids.includes(state.roomID)) continue;
      // Only the model identifier is public, never the provider project/folder path.
      const models = records
        .find((record) => record._id === state.roomID)
        ?.models.map((model) => model.split('/').pop() || '')
        .filter((model) => /^[a-zA-Z0-9._-]+$/.test(model));
      if (models?.length) {
        const label = [...new Set(models)].sort().join(', ');
        if (state.ai.model === 'codex-chatgpt') state.ai.playedModel = label;
        else state.ai.model = label;
      }
    }
    return states;
  }
  private archiveState<T extends Pick<StartedRoomState, 'ai'>>(state: T) {
    if (state.ai) {
      state.ai.canResumeTechnical = false;
    }
    if (state.ai && ['running', 'paused'].includes(state.ai.status)) {
      state.ai.status = 'stopped';
      state.ai.message = 'Сохранённая незавершённая партия. После перезапуска создайте новую.';
    }
    return state;
  }
  async load(id: string) {
    validateID(id);
    const doc = await this.db
      .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
      .findOne({ _id: id });
    if (!doc) return null;
    return (await this.restoreModels([this.archiveState(doc.state)]))[0];
  }
}
