import mongoose from 'mongoose';
import { StartedRoomState, TTotalWinrateStats, TWinrateStats, VisualGameState } from '@avalon/types';
import { roomModel } from '@/db/models/';
import { query } from '@/db/query';
import { UserLayer } from '@/db/user';

export * from '@/db/init';

export class DBManager extends UserLayer {
  dbInstance: mongoose.Mongoose | undefined;

  constructor(dbInstance: mongoose.Mongoose | undefined) {
    super();
    this.dbInstance = dbInstance;
  }

  async saveRoomToDB(roomState: StartedRoomState): Promise<void> {
    const room = new roomModel(roomState);
    await room.save();
  }

  async getRoomFromDB(roomID: string): Promise<StartedRoomState | null> {
    const room = await roomModel.findOne({ roomID });
    return room;
  }

  async getPlayerGames(playerID: string): Promise<VisualGameState[]> {
    const rooms = await roomModel.find({
      'players.id': playerID,
      'game.stage': 'end',
      'game.result.reason': { $ne: 'manualy' },
    });

    return rooms.map((el) => el.game);
  }

  async getLastRooms(amount: number): Promise<StartedRoomState[]> {
    const rooms = await roomModel.find().sort({ _id: -1 }).limit(amount);
    return rooms;
  }

  async getFullStats(): Promise<TTotalWinrateStats> {
    const results = await Promise.all([
      roomModel.aggregate(query.statsByPlayers),
      roomModel.aggregate(query.rolesStats),
      roomModel.aggregate(query.addonsStats),
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
        goodWinPercentage: (totalGamesResult.goodWins / totalGamesResult.gamesCount) * 100,
        evilWinPercentage: (totalGamesResult.evilWins / totalGamesResult.gamesCount) * 100,
      },
      byPlayers: results[0],
      roleStats: results[1],
      addonsStats: results[2],
    };
  }
}
