import { randomUUID } from 'crypto';
import { AI_LEASE_MS } from './timing';
import type { Db } from 'mongodb';
import type { AiBudgetSnapshot, StartedRoomState, TRoomState, TRoomInfo } from '@avalon/types';
import { AiPause, AiMatchBudgetPause } from './client';

export type AiRequestLog = {
  _id: string;
  roomID: string;
  player: string;
  stage: string;
  mode: string;
  startedAt: Date;
  finishedAt?: Date;
  status: string;
  contextReset?: boolean;
  retainedBytes?: number;
  inputBytes?: number;
  reserveUnits?: number;
  actualUnits?: number;
  inputTokens?: number;
  cachedTokens?: number;
  outputTokens?: number;
  httpStatus?: number;
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

type Reservation = { roomID: string; units: number; period?: string; dispatched?: boolean; actual?: number };
type RoomBudget = { _id: string; units: number; limit?: number };

type Ledger = {
  _id: string;
  used: number;
  rooms: Record<string, number>;
  roomLimits?: Record<string, number>;
  owner?: string;
  leaseUntil?: Date;
  anchor?: number;
  periods?: Record<string, number>;
  requests?: Record<string, Reservation>;
  maintenance?: string;
  retiring?: string[];
};
function validateID(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Invalid ID');
}

type ArchiveSummary = Pick<
  StartedRoomState,
  'roomID' | 'ai' | 'stage' | 'leaderID' | 'players' | 'options' | 'createAt' | 'startAt'
> & { game: Pick<StartedRoomState['game'], 'result'> };

export class AiRepository {
  private listCache?: { value: TRoomInfo[]; expires: number };
  private listPending?: Promise<TRoomInfo[]>;
  private listVersion = 0;
  private indexes?: Promise<unknown>;
  private retentionIndexes?: Promise<unknown>;

  constructor(
    private db: Db,
    private totalRub = 700,
    private matchRub = 100,
    private options: { periodDays?: 30; ledgerID?: string } = {},
  ) {
    if (
      ![totalRub, matchRub].every((n) => Number.isFinite(n) && n > 0) ||
      totalRub > (options.periodDays ? 3000 : 700) ||
      matchRub > (options.periodDays ? 200 : 100)
    )
      throw Error('Invalid AI budget limits');
  }
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
      entry.actualUnits !== undefined || entry.status === 'completed'
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
  private get ledgerID() {
    return this.options.ledgerID || 'avalon-ai-v1';
  }
  private get archivedRooms() {
    return this.db.collection<RoomBudget>('ai_room_budgets');
  }
  private archiveID(roomID: string) {
    return `${this.ledgerID}:${roomID}`;
  }
  private get ledger() {
    return this.db.collection<Ledger>('ai_experiment_budget');
  }
  private async initialize() {
    // Midnight in Moscow. Fixed 30-day calendar periods, not a rolling spending window.
    const anchor = Math.floor((Date.now() + 10800000) / 86400000) * 86400000 - 10800000;
    await this.ledger.updateOne(
      { _id: this.options.ledgerID || 'avalon-ai-v1' },
      { $setOnInsert: { used: 0, rooms: {}, anchor, periods: {} } },
      { upsert: true },
    );
  }
  private period(ledger: Ledger) {
    if (!this.options.periodDays) return undefined;
    if (ledger.anchor === undefined) throw new AiPause('Не задано начало периода бюджета.');
    const duration = this.options.periodDays * 86400000;
    return ledger.anchor + Math.max(0, Math.floor((Date.now() - ledger.anchor) / duration)) * duration;
  }
  async budget(): Promise<AiBudgetSnapshot> {
    await this.initialize();
    const ledger = (await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' }))!;
    const start = this.period(ledger);
    const usedRub = (start === undefined ? ledger.used : ledger.periods?.[String(start)] || 0) / 10000;
    return {
      limitRub: this.totalRub,
      usedRub,
      remainingRub: Math.max(0, this.totalRub - usedRub),
      matchLimitRub: this.matchRub,
      periodDays: this.options.periodDays,
      periodStart: start === undefined ? undefined : new Date(start).toISOString(),
      periodEnd: start === undefined ? undefined : new Date(start + 30 * 86400000).toISOString(),
    };
  }
  async claim(roomID: string) {
    validateID(roomID);
    await this.initialize();
    const token = randomUUID();
    const previous = await this.ledger.findOneAndUpdate(
      {
        _id: this.ledgerID,
        retiring: { $ne: roomID },
        $and: [
          { $or: [{ maintenance: { $exists: false } }, { leaseUntil: { $lt: new Date() } }] },
          { $or: [{ owner: { $exists: false } }, { leaseUntil: { $lt: new Date() } }, { owner: roomID }] },
        ],
      },
      { $set: { owner: roomID, maintenance: token, leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
      { returnDocument: 'before' },
    );
    if (!previous) throw new AiPause('Другая AI-партия уже запущена.');
    try {
      if (await this.archivedRooms.findOne({ _id: this.archiveID(roomID) }))
        throw new AiPause('Архивная партия не может расходовать бюджет.');
      // An abandoned pre-dispatch reservation cannot have incurred a provider charge.
      // Apply refunds and remove their receipts in the same document write.
      const recover = previous.owner !== roomID || (previous.leaseUntil?.getTime() || 0) < Date.now();
      if (recover) {
        const refunds: Record<string, number> = {};
        const receipts: Record<string, ''> = {};
        for (const [id, request] of Object.entries(previous.requests || {})) {
          if (request.dispatched || request.actual !== undefined) continue;
          for (const key of [
            'used',
            `rooms.${request.roomID}`,
            ...(request.period ? [`periods.${request.period}`] : []),
          ])
            refunds[key] = (refunds[key] || 0) - request.units;
          receipts[`requests.${id}`] = '';
        }
        if (Object.keys(receipts).length)
          await this.ledger.updateOne({ _id: this.ledgerID, maintenance: token }, { $inc: refunds, $unset: receipts });
      }
      const current = await this.ledger.findOne({ _id: this.ledgerID, maintenance: token });
      if (!current) throw new AiPause('Потеряно управление AI-партией.');
      const retired = Object.entries(current.rooms).filter(([id]) => id !== roomID);
      if (retired.length) {
        // This durable barrier outlives the maintenance lease. A delayed archive writer
        // cannot publish stale totals while another claimant reopens a retiring room.
        const barrier = await this.ledger.updateOne(
          { _id: this.ledgerID, maintenance: token },
          { $set: { retiring: retired.map(([id]) => id) } },
        );
        if (!barrier.matchedCount) throw new AiPause('Потеряно управление AI-партией.');
        // Persist immutable historical totals before removing counters. A restart can repeat both steps.
        await this.archivedRooms.bulkWrite(
          retired.map(([id, units]) => ({
            updateOne: {
              filter: { _id: this.archiveID(id) },
              update: { $setOnInsert: { units, limit: current.roomLimits?.[id] ?? this.matchRub } },
              upsert: true,
            },
          })),
        );
      }
      const periods = Object.entries(current.periods || {}).sort(([a], [b]) => Number(b) - Number(a));
      const retainedPeriods = new Set(periods.slice(0, 24).map(([period]) => period));
      const activePeriod = this.period(current);
      if (activePeriod !== undefined) retainedPeriods.add(String(activePeriod));
      for (const request of Object.values(current.requests || {}))
        if (request.roomID === roomID && request.actual === undefined && request.period)
          retainedPeriods.add(request.period);
      const retiredPeriods = periods.filter(([period]) => !retainedPeriods.has(period));
      if (retiredPeriods.length)
        await this.db.collection<{ _id: string; units: number }>('ai_budget_periods').bulkWrite(
          retiredPeriods.map(([period, units]) => ({
            updateOne: {
              filter: { _id: `${this.ledgerID}:${period}` },
              update: { $setOnInsert: { units } },
              upsert: true,
            },
          })),
        );
      const remove: Record<string, ''> = { retiring: '' };
      for (const [period] of retiredPeriods) remove[`periods.${period}`] = '';
      for (const [id] of retired) {
        remove[`rooms.${id}`] = '';
        remove[`roomLimits.${id}`] = '';
      }
      for (const [id, request] of Object.entries(current.requests || {}))
        if (request.roomID !== roomID) remove[`requests.${id}`] = '';
      if (Object.keys(remove).length)
        await this.ledger.updateOne({ _id: this.ledgerID, maintenance: token }, { $unset: remove });
    } catch (error) {
      await this.ledger.updateOne(
        { _id: this.ledgerID, maintenance: token },
        { $unset: { owner: '', leaseUntil: '' } },
      );
      throw error;
    } finally {
      await this.ledger.updateOne({ _id: this.ledgerID, maintenance: token }, { $unset: { maintenance: '' } });
    }
  }
  async release(roomID: string) {
    validateID(roomID);
    await this.ledger.updateOne(
      { _id: this.options.ledgerID || 'avalon-ai-v1', owner: roomID },
      { $unset: { owner: '', leaseUntil: '' } },
    );
  }
  async reserve(roomID: string, units: number, requestID?: string) {
    if (requestID !== undefined) validateID(requestID);
    validateID(roomID);
    if (!Number.isSafeInteger(units) || units <= 0 || !/^[a-zA-Z0-9-]+$/.test(roomID))
      throw new AiPause('Ошибка учёта расхода.');
    const roomKey = `rooms.${roomID}`;
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    if (!ledger || ledger.owner !== roomID) throw new AiPause('Потеряно управление AI-партией.');
    if (requestID && ledger.requests?.[requestID]) throw new AiPause('Запрос уже зарезервирован.');
    if (Object.keys(ledger.requests || {}).length >= 2048) throw new AiPause('Достигнут предел запросов партии.');
    const matchRub = ledger.roomLimits?.[roomID] ?? this.matchRub;
    const period = this.period(ledger);
    const totalKey = period === undefined ? 'used' : `periods.${period}`;
    const result = await this.ledger.updateOne(
      {
        _id: ledger._id,
        owner: roomID,
        maintenance: { $exists: false },
        ...(requestID ? { [`requests.${requestID}`]: { $exists: false } } : {}),
        $expr: {
          $and: [
            { $lt: [{ $size: { $objectToArray: { $ifNull: ['$requests', {}] } } }, 2048] },
            { $lte: [{ $ifNull: [`$${totalKey}`, 0] }, Math.floor(this.totalRub * 10000) - units] },
            { $lte: [{ $ifNull: [`$${roomKey}`, 0] }, Math.floor(matchRub * 10000) - units] },
          ],
        },
      },
      {
        $inc: { used: units, [roomKey]: units, ...(period === undefined ? {} : { [totalKey]: units }) },
        $set: {
          leaseUntil: new Date(Date.now() + AI_LEASE_MS),
          ...(requestID
            ? {
                [`requests.${requestID}`]: {
                  roomID,
                  units,
                  ...(period === undefined ? {} : { period: String(period) }),
                },
              }
            : {}),
        },
      },
    );
    if (!result.matchedCount) {
      const current = await this.ledger.findOne({ _id: ledger._id });
      if (current?.owner !== roomID) throw new AiPause('Потеряно управление AI-партией.');
      const roomRub = (current.rooms[roomID] || 0) / 10000;
      const budget = await this.budget();
      if (roomRub + units / 10000 > matchRub)
        throw new AiMatchBudgetPause(
          `Лимит партии ${matchRub} ₽: использовано ${roomRub.toFixed(2)} ₽, резерв запроса ${(units / 10000).toFixed(2)} ₽.`,
          units,
        );
      throw new AiPause(
        `Лимит бюджета ${this.totalRub} ₽: использовано ${budget.usedRub.toFixed(2)} ₽, резерв запроса ${(units / 10000).toFixed(2)} ₽.`,
      );
    }
    return period === undefined ? undefined : String(period);
  }
  async roomLimit(roomID: string) {
    validateID(roomID);
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    if (ledger?.rooms[roomID] !== undefined || ledger?.roomLimits?.[roomID] !== undefined)
      return ledger.roomLimits?.[roomID] ?? this.matchRub;
    return (await this.archivedRooms.findOne({ _id: this.archiveID(roomID) }))?.limit ?? this.matchRub;
  }
  async doubleMatchLimit(roomID: string, reserveUnits: number) {
    validateID(roomID);
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(roomID) || !Number.isSafeInteger(reserveUnits) || reserveUnits <= 0)
      throw new AiPause('Invalid resume request');
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    if (!ledger || ledger.owner !== roomID) throw new AiPause('Потеряно управление AI-партией.');
    const previous = ledger.roomLimits?.[roomID];
    const next = (previous ?? this.matchRub) * 2;
    if (
      !Number.isSafeInteger(Math.floor(next * 10000)) ||
      (ledger.rooms[roomID] || 0) + reserveUnits > Math.floor(next * 10000)
    )
      throw new AiPause('Удвоенного лимита недостаточно для следующего запроса.');
    const period = this.period(ledger);
    const totalKey = period === undefined ? 'used' : `periods.${period}`;
    const result = await this.ledger.updateOne(
      {
        _id: ledger._id,
        owner: roomID,
        maintenance: { $exists: false },
        [`roomLimits.${roomID}`]: previous ?? { $exists: false },
        $expr: { $lte: [{ $ifNull: [`$${totalKey}`, 0] }, Math.floor(this.totalRub * 10000) - reserveUnits] },
      },
      { $set: { [`roomLimits.${roomID}`]: next } },
    );
    if (!result.matchedCount) throw new AiPause('Лимит бюджета исчерпан или состояние партии изменилось.');
    return next;
  }
  async markDispatched(roomID: string, requestID: string) {
    validateID(roomID);
    validateID(requestID);
    const result = await this.ledger.updateOne(
      {
        _id: this.ledgerID,
        owner: roomID,
        maintenance: { $exists: false },
        [`requests.${requestID}.roomID`]: roomID,
        [`requests.${requestID}.actual`]: { $exists: false },
      },
      { $set: { [`requests.${requestID}.dispatched`]: true } },
    );
    if (!result.matchedCount) throw new AiPause('Потерян резерв запроса.');
  }
  async settle(roomID: string, reserved: number, actual: number, period?: string, requestID?: string) {
    if (requestID !== undefined) validateID(requestID);
    validateID(roomID);
    if (
      !Number.isSafeInteger(actual) ||
      actual < 0 ||
      !Number.isSafeInteger(reserved) ||
      reserved <= 0 ||
      !/^[a-zA-Z0-9-]+$/.test(roomID) ||
      (period !== undefined && !/^\d+$/.test(period))
    )
      throw new AiPause('Некорректный расход API.');
    if (this.options.periodDays && period === undefined) throw new AiPause('Не указан период резерва.');
    const result = await this.ledger.updateOne(
      {
        _id: this.ledgerID,
        owner: roomID,
        maintenance: { $exists: false },
        ...(requestID
          ? {
              [`requests.${requestID}.roomID`]: roomID,
              [`requests.${requestID}.units`]: reserved,
              [`requests.${requestID}.period`]: period ?? { $exists: false },
              [`requests.${requestID}.actual`]: { $exists: false },
            }
          : {}),
      },
      {
        ...(requestID ? { $set: { [`requests.${requestID}.actual`]: actual } } : {}),
        $inc: {
          used: actual - reserved,
          [`rooms.${roomID}`]: actual - reserved,
          ...(period === undefined ? {} : { [`periods.${period}`]: actual - reserved }),
        },
      },
    );
    if (!result.matchedCount) {
      const ledger = await this.ledger.findOne({ _id: this.ledgerID });
      const receipt = requestID ? ledger?.requests?.[requestID] : undefined;
      if (
        !receipt ||
        receipt.roomID !== roomID ||
        receipt.units !== reserved ||
        receipt.period !== period ||
        receipt.actual !== actual
      )
        throw new AiPause('Расчёт запроса уже закрыт или резерв изменился.');
    }
    if (actual > reserved) throw new AiPause('Расход превысил резерв. Требуется проверка тарифа.');
  }
  async roomCost(roomID: string) {
    validateID(roomID);
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    const units =
      ledger?.rooms[roomID] ?? (await this.archivedRooms.findOne({ _id: this.archiveID(roomID) }))?.units ?? 0;
    return units / 10000;
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
        aiModel: state.ai?.model,
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
    const ids = states.filter((state) => state.ai && !state.ai.model).map((state) => state.roomID);
    if (!ids.length) return states;
    const records = await this.db
      .collection<AiDecisionTrace>('ai_decision_traces')
      .aggregate<{ _id: string; models: string[] }>([
        { $match: { roomID: { $in: ids }, 'payload.model': { $type: 'string' } } },
        { $group: { _id: '$roomID', models: { $addToSet: '$payload.model' } } },
      ])
      .toArray();
    for (const state of states) {
      if (!state.ai || state.ai.model) continue;
      // Only the model identifier is public, never the provider project/folder path.
      const models = records
        .find((record) => record._id === state.roomID)
        ?.models.map((model) => model.split('/').pop() || '')
        .filter((model) => /^[a-zA-Z0-9._-]+$/.test(model));
      if (models?.length) state.ai.model = [...new Set(models)].sort().join(', ');
    }
    return states;
  }
  private archiveState<T extends Pick<StartedRoomState, 'ai'>>(state: T) {
    if (state.ai) {
      state.ai.canResumeBudget = false;
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
