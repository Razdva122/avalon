import mongoose from 'mongoose';
import { PlayerGameSummary, StartedRoomState, TTotalWinrateStats, TWinrateStats, VisualGameState } from '@avalon/types';
import { roomModel } from '@/db/models/';
import { query } from '@/db/query';
import { UserLayer } from '@/db/user';

export * from '@/db/init';

function validateID(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Invalid ID');
}

export class DBManager extends UserLayer {
  private statsCache?: { value: TTotalWinrateStats; expires: number };
  private statsPending?: Promise<TTotalWinrateStats>;
  private statsVersion = 0;
  dbInstance: mongoose.Mongoose | undefined;

  constructor(dbInstance: mongoose.Mongoose | undefined) {
    super();
    this.dbInstance = dbInstance;
  }

  async saveRoomToDB(roomState: StartedRoomState): Promise<void> {
    const room = new roomModel(roomState);
    await room.save();
    this.statsVersion++;
    this.statsCache = undefined;
  }

  async getRoomFromDB(roomID: string): Promise<StartedRoomState | null> {
    validateID(roomID);
    const room = await roomModel.findOne({ roomID });
    return room;
  }

  async getPlayerGames(playerID: string): Promise<VisualGameState[]> {
    validateID(playerID);
    const rooms = await roomModel
      .find({
        'players.id': playerID,
        'game.stage': 'end',
        'game.result.reason': { $ne: 'manualy' },
      })
      .sort({ _id: -1 })
      .limit(100)
      .maxTimeMS(10000);

    return rooms.map((el) => el.game);
  }

  async getPlayerGameSummaries(playerID: string): Promise<PlayerGameSummary[]> {
    validateID(playerID);
    const rooms = await roomModel
      .find(
        { 'players.id': playerID, 'game.stage': 'end', 'game.result.reason': { $ne: 'manualy' } },
        { _id: 0, 'game.uuid': 1, 'game.players.id': 1, 'game.players.role': 1, 'game.result.winner': 1 },
      )
      .sort({ _id: 1 })
      .maxTimeMS(10000)
      .lean();
    return rooms.map((room) => room.game);
  }

  async getLastRooms(amount: number): Promise<StartedRoomState[]> {
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100) throw new Error('Invalid room limit');
    const rooms = await roomModel.find().sort({ _id: -1 }).limit(amount).maxTimeMS(10000);
    return rooms;
  }

  async getFullStats(): Promise<TTotalWinrateStats> {
    if (this.statsCache && this.statsCache.expires > Date.now()) return this.statsCache.value;
    if (this.statsPending) return this.statsPending;
    const version = this.statsVersion;
    const pending = this.calculateFullStats().then((value) => {
      if (version === this.statsVersion) this.statsCache = { value, expires: Date.now() + 60000 };
      return value;
    });
    this.statsPending = pending;
    try {
      return await pending;
    } finally {
      if (this.statsPending === pending) this.statsPending = undefined;
    }
  }

  private async calculateFullStats(): Promise<TTotalWinrateStats> {
    const results = await Promise.all([
      roomModel.aggregate(query.statsByPlayers).option({ maxTimeMS: 10000 }),
      roomModel.aggregate(query.rolesStats).option({ maxTimeMS: 10000 }),
      roomModel.aggregate(query.addonsStats).option({ maxTimeMS: 10000 }),
    ]);

    const totalGamesResult = results[0].reduce<Omit<TWinrateStats, 'goodWinPercentage' | 'evilWinPercentage'>>(
      (acc, el) => {
        acc.gamesCount += el.gamesCount;
        acc.evilWins += el.evilWins;
        acc.goodWins += el.goodWins;

        return acc;
      },
      { gamesCount: 0, goodWins: 0, evilWins: 0 },
    );

    return {
      total: {
        ...totalGamesResult,
        goodWinPercentage:
          totalGamesResult.gamesCount > 0 ? (totalGamesResult.goodWins / totalGamesResult.gamesCount) * 100 : 0,
        evilWinPercentage:
          totalGamesResult.gamesCount > 0 ? (totalGamesResult.evilWins / totalGamesResult.gamesCount) * 100 : 0,
      },
      byPlayers: results[0],
      roleStats: results[1],
      addonsStats: results[2],
    };
  }
}
