import mongoose from 'mongoose';
import { getModelForClass } from '@typegoose/typegoose';
import { StartedRoomState, TTotalWinrateStats, TWinrateStats } from '@avalon/types';

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
    const result = await this.roomModel.aggregate([
      { $match: { 'game.stage': 'end', 'game.result.reason': { $ne: 'manual' } } },

      {
        $addFields: {
          playerCount: { $size: '$players' },
        },
      },

      {
        $group: {
          _id: { playerCount: '$playerCount', winner: '$game.result.winner' },
          totalGames: { $sum: 1 },
        },
      },

      {
        $group: {
          _id: '$_id.playerCount',
          gamesCount: { $sum: '$totalGames' },
          goodWins: {
            $sum: {
              $cond: [{ $eq: ['$_id.winner', 'good'] }, '$totalGames', 0],
            },
          },
          evilWins: {
            $sum: {
              $cond: [{ $eq: ['$_id.winner', 'evil'] }, '$totalGames', 0],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          playerCount: '$_id',
          gamesCount: 1,
          goodWinPercentage: {
            $multiply: [{ $divide: ['$goodWins', { $add: ['$goodWins', '$evilWins'] }] }, 100],
          },
          evilWinPercentage: {
            $multiply: [{ $divide: ['$evilWins', { $add: ['$goodWins', '$evilWins'] }] }, 100],
          },
          goodWins: '$goodWins',
          evilWins: '$evilWins',
        },
      },

      { $sort: { playerCount: 1 } },
    ]);

    const totalGamesResult = result.reduce<Omit<TWinrateStats, 'goodWinPercentage' | 'evilWinPercentage'>>(
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
      byPlayers: result,
    };
  }
}
