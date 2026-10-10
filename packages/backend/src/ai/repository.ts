import { aiPlayedModel } from '@avalon/types';
import { AI_LEASE_MS } from './timing';
import { calculateAiRatings } from './ratings';
import { AI_PROFILE_RATING_SEASON } from './rating-season';
import type { Db } from 'mongodb';
import type { StartedRoomState, TRoomState, TRoomInfo, PlayerGameSummaryPage } from '@avalon/types';
import { AiPause } from './client';

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
  inputTokens?: number;
  cachedTokens?: number;
  outputTokens?: number;
};

export type AiDecisionTrace = {
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
        this.db.collection('ai_request_costs').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
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
  async claim(roomID: string) {
    validateID(roomID);
    await this.ledger.updateOne({ _id: this.ledgerID }, { $setOnInsert: { _id: this.ledgerID } }, { upsert: true });
    const previous = await this.ledger.findOneAndUpdate(
      {
        _id: this.ledgerID,
        $or: [{ owner: { $exists: false } }, { leaseUntil: { $lt: new Date() } }, { owner: roomID }],
      },
      { $set: { owner: roomID, leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
      { returnDocument: 'before' },
    );
    if (!previous) throw new AiPause('Другая AI-партия уже запущена.');
  }
  async release(roomID: string) {
    validateID(roomID);
    await this.ledger.updateOne({ _id: this.ledgerID, owner: roomID }, { $unset: { owner: '', leaseUntil: '' } });
  }
  async renewLease(roomID: string) {
    validateID(roomID);
    const result = await this.ledger.updateOne(
      { _id: this.ledgerID, owner: roomID, leaseUntil: { $gt: new Date() } },
      { $set: { leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
    );
    if (!result.matchedCount) throw new AiPause('Потеряно управление AI-партией.');
  }
  async save(state: TRoomState) {
    // Separate collection keeps AI replays out of all existing ranked statistics queries.
    if (state.stage !== 'started') return;
    validateID(state.roomID);
    await this.db
      .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
      .updateOne({ _id: state.roomID }, { $set: { state: structuredClone(state) } }, { upsert: true });
    this.listVersion++;
    this.listCache = undefined;
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
        {},
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
      .filter((state) => state.ai)
      .map((state) => ({
        uuid: state.roomID,
        ai: true,
        aiStatus: state.ai?.status,
        aiModel: aiPlayedModel(state.ai),
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
