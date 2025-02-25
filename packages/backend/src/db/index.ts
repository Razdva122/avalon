import mongoose from 'mongoose';
import { getModelForClass } from '@typegoose/typegoose';
import { StartedRoomState, TTotalWinrateStats, TWinrateStats } from '@avalon/types';
import { query } from '@/db/query';

export * from '@/db/init';

export class DBManager {
  roomModel = getModelForClass(StartedRoomState);
  dbInstance: mongoose.Mongoose | undefined;

  constructor(dbInstance: mongoose.Mongoose | undefined) {
    this.dbInstance = dbInstance;
  }

  async saveRoomToDB(roomState: StartedRoomState): Promise<void> {
    const room = new this.roomModel(roomState);
    room.save();
  }

  async getRoomFromDB(roomID: string): Promise<StartedRoomState | null> {
    const room = await this.roomModel.findOne({ roomID });
    return room;
  }

  async getLastRooms(amount: number): Promise<StartedRoomState[]> {
    const rooms = await this.roomModel.find().sort({ _id: -1 }).limit(amount);

    return rooms;
  }

  async getFullStats(): Promise<TTotalWinrateStats> {
    const results = await Promise.all([
      this.roomModel.aggregate(query.statsByPlayers),
      this.roomModel.aggregate(query.rolesStats),
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
    };
  }
}
