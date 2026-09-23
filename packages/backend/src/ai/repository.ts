import { AI_LEASE_MS } from './timing';
import type { Db } from 'mongodb';
import type { AiBudgetSnapshot, StartedRoomState, TRoomState } from '@avalon/types';
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

type Ledger = {
  _id: string;
  used: number;
  rooms: Record<string, number>;
  roomLimits?: Record<string, number>;
  owner?: string;
  leaseUntil?: Date;
  anchor?: number;
  periods?: Record<string, number>;
};
export class AiRepository {
  constructor(
    private db: Db,
    private totalRub = 700,
    private matchRub = 100,
    private options: { periodDays?: 30; ledgerID?: string } = {},
  ) {
    if (
      ![totalRub, matchRub].every((n) => Number.isFinite(n) && n > 0) ||
      totalRub > (options.periodDays ? 3000 : 700) ||
      matchRub > (options.periodDays ? 150 : 100)
    )
      throw Error('Invalid AI budget limits');
  }
  async recordRequest(entry: AiRequestLog) {
    await this.db
      .collection<AiRequestLog>('ai_request_costs')
      .updateOne({ _id: entry._id }, { $set: entry }, { upsert: true });
  }
  // Server-only diagnostics: never included in public room states or replays.
  async recordDecision(entry: AiDecisionTrace) {
    await this.db
      .collection<AiDecisionTrace>('ai_decision_traces')
      .updateOne({ _id: entry._id }, { $set: entry }, { upsert: true });
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
    await this.initialize();
    const result = await this.ledger.updateOne(
      {
        _id: this.options.ledgerID || 'avalon-ai-v1',
        $or: [{ owner: { $exists: false } }, { leaseUntil: { $lt: new Date() } }, { owner: roomID }],
      },
      { $set: { owner: roomID, leaseUntil: new Date(Date.now() + AI_LEASE_MS) } },
    );
    if (!result.matchedCount) throw new AiPause('Другая AI-партия уже запущена.');
  }
  async release(roomID: string) {
    await this.ledger.updateOne(
      { _id: this.options.ledgerID || 'avalon-ai-v1', owner: roomID },
      { $unset: { owner: '', leaseUntil: '' } },
    );
  }
  async reserve(roomID: string, units: number) {
    if (!Number.isSafeInteger(units) || units <= 0 || !/^[a-zA-Z0-9-]+$/.test(roomID))
      throw new AiPause('Ошибка учёта расхода.');
    const roomKey = `rooms.${roomID}`;
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    if (!ledger || ledger.owner !== roomID) throw new AiPause('Потеряно управление AI-партией.');
    const matchRub = ledger.roomLimits?.[roomID] ?? this.matchRub;
    const period = this.period(ledger);
    const totalKey = period === undefined ? 'used' : `periods.${period}`;
    const result = await this.ledger.updateOne(
      {
        _id: ledger._id,
        owner: roomID,
        $expr: {
          $and: [
            { $lte: [{ $ifNull: [`$${totalKey}`, 0] }, Math.floor(this.totalRub * 10000) - units] },
            { $lte: [{ $ifNull: [`$${roomKey}`, 0] }, Math.floor(matchRub * 10000) - units] },
          ],
        },
      },
      {
        $inc: { used: units, [roomKey]: units, ...(period === undefined ? {} : { [totalKey]: units }) },
        $set: { leaseUntil: new Date(Date.now() + AI_LEASE_MS) },
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
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    return ledger?.roomLimits?.[roomID] ?? this.matchRub;
  }
  async doubleMatchLimit(roomID: string, reserveUnits: number) {
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
        [`roomLimits.${roomID}`]: previous ?? { $exists: false },
        $expr: { $lte: [{ $ifNull: [`$${totalKey}`, 0] }, Math.floor(this.totalRub * 10000) - reserveUnits] },
      },
      { $set: { [`roomLimits.${roomID}`]: next } },
    );
    if (!result.matchedCount) throw new AiPause('Лимит бюджета исчерпан или состояние партии изменилось.');
    return next;
  }
  async settle(roomID: string, reserved: number, actual: number, period?: string) {
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
    await this.ledger.updateOne(
      { _id: this.options.ledgerID || 'avalon-ai-v1' },
      {
        $inc: {
          used: actual - reserved,
          [`rooms.${roomID}`]: actual - reserved,
          ...(period === undefined ? {} : { [`periods.${period}`]: actual - reserved }),
        },
      },
    );
    if (actual > reserved) throw new AiPause('Расход превысил резерв. Требуется проверка тарифа.');
  }
  async roomCost(roomID: string) {
    const ledger = await this.ledger.findOne({ _id: this.options.ledgerID || 'avalon-ai-v1' });
    return (ledger?.rooms[roomID] || 0) / 10000;
  }
  async save(state: TRoomState) {
    // Separate collection keeps AI replays out of all existing ranked statistics queries.
    if (state.stage !== 'started') return;
    await this.db
      .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
      .updateOne({ _id: state.roomID }, { $set: { state: structuredClone(state) } }, { upsert: true });
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
  private async restoreModels(states: StartedRoomState[]): Promise<StartedRoomState[]> {
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
  private archiveState(state: StartedRoomState) {
    if (state.ai) state.ai.canResumeBudget = false;
    if (state.ai && ['running', 'paused'].includes(state.ai.status)) {
      state.ai.status = 'stopped';
      state.ai.message = 'Сохранённая незавершённая партия. После перезапуска создайте новую.';
    }
    return state;
  }
  async load(id: string) {
    const doc = await this.db
      .collection<{ _id: string; state: StartedRoomState }>('ai_room_replays')
      .findOne({ _id: id });
    if (!doc) return null;
    return (await this.restoreModels([this.archiveState(doc.state)]))[0];
  }
}
