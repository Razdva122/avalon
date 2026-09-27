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
  dbInstance: mongoose.Mongoose | undefined;

  constructor(dbInstance: mongoose.Mongoose | undefined) {
    super();
    this.dbInstance = dbInstance;
  }

  async saveRoomToDB(roomState: StartedRoomState): Promise<void> {
    await roomModel.updateOne(
      { roomID: roomState.roomID },
      {
        $setOnInsert: {
          ...roomState,
          completionPending: Boolean(roomState.game?.result?.winner && roomState.game.result.reason !== 'manualy'),
        },
      },
      { upsert: true, runValidators: true },
    );
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
    const page = await this.getPlayerGameSummariesPage(playerID);
    if (page.nextCursor) throw Error('paginationRequired');
    return page.games;
  }

  async getPlayerGameSummariesPage(
    playerID: string,
    cursor?: string | null,
  ): Promise<{ games: PlayerGameSummary[]; nextCursor?: string }> {
    validateID(playerID);
    if (cursor != null && (typeof cursor !== 'string' || !/^[a-f0-9]{24}:[a-f0-9]{24}$/.test(cursor)))
      throw Error('Invalid history cursor');
    const [after, upper] = cursor?.split(':') ?? [];
    const newest = upper
      ? undefined
      : await roomModel
          .findOne(
            { 'players.id': playerID, 'game.stage': 'end', 'game.result.reason': { $ne: 'manualy' } },
            { _id: 1 },
          )
          .sort({ _id: -1 })
          .maxTimeMS(10000)
          .lean();
    if (!upper && !newest) return { games: [] };
    const ceiling = upper ? new mongoose.Types.ObjectId(upper) : newest!._id;
    const rooms = await roomModel
      .find(
        {
          'players.id': playerID,
          'game.stage': 'end',
          'game.result.reason': { $ne: 'manualy' },
          _id: { $lte: ceiling, ...(after ? { $gt: new mongoose.Types.ObjectId(after) } : {}) },
        },
        { _id: 1, 'game.uuid': 1, 'game.players.id': 1, 'game.players.role': 1, 'game.result.winner': 1 },
      )
      .sort({ _id: 1 })
      .limit(201)
      .maxTimeMS(10000)
      .lean();
    const visible = rooms.slice(0, 200);
    return {
      games: visible.map((room) => room.game),
      ...(rooms.length > 200 ? { nextCursor: `${visible[199]._id}:${ceiling}` } : {}),
    };
  }

  async getLastRooms(amount: number): Promise<StartedRoomState[]> {
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100) throw new Error('Invalid room limit');
    const rooms = await roomModel.find().sort({ _id: -1 }).limit(amount).maxTimeMS(10000);
    return rooms;
  }

  async getFullStats(): Promise<TTotalWinrateStats> {
    if (this.statsCache && this.statsCache.expires > Date.now()) return this.statsCache.value;
    if (this.statsPending) return this.statsPending;
    const pending = this.calculateFullStats().then((value) => {
      this.statsCache = { value, expires: Date.now() + 60000 };
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
    const [facets] = await roomModel
      .aggregate([
        query.statsByPlayers[0],
        {
          $facet: {
            byPlayers: query.statsByPlayers.slice(1),
            roles: query.rolesStats.slice(1),
            addons: query.addonsStats.slice(1),
          },
        },
      ])
      .option({ maxTimeMS: 10000 });
    const results = [facets.byPlayers, facets.roles, facets.addons];

    const totalGamesResult = (results[0] as TWinrateStats[]).reduce<
      Omit<TWinrateStats, 'goodWinPercentage' | 'evilWinPercentage'>
    >(
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
