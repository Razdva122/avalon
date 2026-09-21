import type { Db } from 'mongodb';
import type { StartedRoomState, TRoomState } from '@avalon/types';
import { AiPause } from './client';

type Ledger = { _id: string; used: number; rooms: Record<string, number>; owner?: string; leaseUntil?: Date };
export class AiRepository {
  constructor(
    private db: Db,
    private totalRub = 500,
    private matchRub = 50,
  ) {
    if (![totalRub, matchRub].every((n) => Number.isFinite(n) && n > 0) || totalRub > 500 || matchRub > 50)
      throw Error('AI budget must be positive and no greater than 500 RUB total / 50 RUB per game');
  }
  private get ledger() {
    return this.db.collection<Ledger>('ai_experiment_budget');
  }
  async claim(roomID: string) {
    await this.ledger.updateOne({ _id: 'avalon-ai-v1' }, { $setOnInsert: { used: 0, rooms: {} } }, { upsert: true });
    const result = await this.ledger.updateOne(
      {
        _id: 'avalon-ai-v1',
        $or: [{ owner: { $exists: false } }, { leaseUntil: { $lt: new Date() } }, { owner: roomID }],
      },
      { $set: { owner: roomID, leaseUntil: new Date(Date.now() + 120000) } },
    );
    if (!result.matchedCount) throw new AiPause('Другая AI-партия уже запущена.');
  }
  async release(roomID: string) {
    await this.ledger.updateOne({ _id: 'avalon-ai-v1', owner: roomID }, { $unset: { owner: '', leaseUntil: '' } });
  }
  async reserve(roomID: string, units: number) {
    if (!Number.isSafeInteger(units) || units <= 0 || !/^[a-zA-Z0-9-]+$/.test(roomID))
      throw new AiPause('Ошибка учёта расхода.');
    const roomKey = `rooms.${roomID}`;
    const result = await this.ledger.updateOne(
      {
        _id: 'avalon-ai-v1',
        owner: roomID,
        used: { $lte: Math.floor(this.totalRub * 10000) - units },
        $expr: { $lte: [{ $ifNull: [`$${roomKey}`, 0] }, Math.floor(this.matchRub * 10000) - units] },
      },
      { $inc: { used: units, [roomKey]: units }, $set: { leaseUntil: new Date(Date.now() + 120000) } },
    );
    if (!result.matchedCount) throw new AiPause('Достигнут лимит расходов или потеряно управление партией.');
  }
  async settle(roomID: string, reserved: number, actual: number) {
    if (!Number.isSafeInteger(actual) || actual < 0) throw new AiPause('Некорректный расход API.');
    await this.ledger.updateOne(
      { _id: 'avalon-ai-v1' },
      { $inc: { used: actual - reserved, [`rooms.${roomID}`]: actual - reserved } },
    );
    if (actual > reserved) throw new AiPause('Расход превысил резерв. Требуется проверка тарифа.');
  }
  async roomCost(roomID: string) {
    const ledger = await this.ledger.findOne({ _id: 'avalon-ai-v1' });
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
    return docs.map(({ state }) => this.archiveState(state));
  }
  private archiveState(state: StartedRoomState) {
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
    return this.archiveState(doc.state);
  }
}
