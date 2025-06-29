import { playerTrueSkillRatingModel, gameTrueSkillResultModel } from '../db/models';
import { ServerSocket } from '@avalon/types';
import { trueSkillCalculator } from './trueSkillCalculator';
import { TrueSkillLeaderboardEntry } from '@avalon/types/api/trueskill-sockets';
import { DEFAULT_MU, DEFAULT_SIGMA, calculateConservativeRating } from '@avalon/types/stats/trueskill-constants';

/**
 * Register TrueSkill rating endpoints
 * @param socket The socket instance
 */
export function registerTrueSkillRatingEndpoints(socket: ServerSocket): void {
  // Get player TrueSkill rating
  socket.on('getTrueSkillRating', async (userID: string, callback) => {
    const rating = await playerTrueSkillRatingModel.findOne({ userID }).lean();

    if (!rating) {
      callback({
        success: false,
        error: `Player rating ${userID} does not exist`,
      });
      return;
    }

    callback({
      success: true,
      rating,
    });
  });

  // Get TrueSkill leaderboard
  socket.on('getTrueSkillLeaderboard', async (callback) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get all ratings for players with sigma less than 1200 and who played in the last month
    const ratings = await playerTrueSkillRatingModel
      .find({
        sigma: { $lt: 1200 },
        lastPlayedAt: { $gte: oneMonthAgo },
      })
      .sort({ mu: -1 })
      .limit(50)
      .lean();

    // Calculate conservative rating and sort
    const ratingsWithConservative = ratings.map((r) => ({
      ...r,
      conservativeRating: trueSkillCalculator.calculateConservativeRating(r.mu, r.sigma),
    }));

    // Create leaderboard entries with rank
    const leaderboard: TrueSkillLeaderboardEntry[] = ratingsWithConservative.map((rating, index) => {
      return {
        rank: index + 1,
        userID: rating.userID,
        mu: rating.mu,
        sigma: rating.sigma,
        conservativeRating: rating.conservativeRating,
        gamesCount: rating.gamesCount,
        wins: rating.wins,
        losses: rating.losses,
      };
    });

    callback({
      success: true,
      leaderboard,
    });
  });

  // Get match TrueSkill changes
  socket.on('getMatchTrueSkillChanges', async (gameID: string, callback) => {
    // Find the game by its ID
    const gameResult = await gameTrueSkillResultModel.findOne({ gameID }).lean();

    if (!gameResult) {
      callback({
        success: false,
        error: 'Game not found',
      });
      return;
    }

    callback({
      success: true,
      gameResult,
    });
  });

  // Reset player TrueSkill rating
  socket.on(
    'resetTrueSkillRating',
    async (
      userID: string,
      callback: (result: { success: boolean; message?: string; error?: string; nextResetAvailableAt?: Date }) => void,
    ) => {
      try {
        // Получаем текущий рейтинг пользователя
        const rating = await playerTrueSkillRatingModel.findOne({ userID }).lean();

        if (!rating) {
          callback({
            success: false,
            error: 'Player rating not found',
          });
          return;
        }

        // Проверяем, прошло ли 3 месяца с момента последнего сброса
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        if (rating.lastResetAt && new Date(rating.lastResetAt) > threeMonthsAgo) {
          callback({
            success: false,
            error: 'Rating can only be reset once every 3 months',
            nextResetAvailableAt: rating.lastResetAt,
          });
          return;
        }

        // Сбрасываем рейтинг на стандартные значения
        await playerTrueSkillRatingModel.updateOne(
          { userID },
          {
            $set: {
              mu: DEFAULT_MU,
              sigma: DEFAULT_SIGMA,
              conservativeRating: calculateConservativeRating(DEFAULT_MU, DEFAULT_SIGMA),
              lastResetAt: new Date(),
            },
          },
        );

        callback({
          success: true,
          message: 'Rating has been reset successfully',
        });
      } catch (error) {
        console.error('Error resetting TrueSkill rating:', error);
        callback({
          success: false,
          error: 'Failed to reset rating',
        });
      }
    },
  );
}
