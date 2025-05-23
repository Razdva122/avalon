import { playerTrueSkillRatingModel, gameTrueSkillResultModel } from '../db/models';
import { ServerSocket } from '@avalon/types';
import { trueSkillCalculator } from './trueSkillCalculator';
import { TrueSkillLeaderboardEntry } from '@avalon/types/api/trueskill-sockets';

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

    // Get all ratings for players with at least 10 games and who played in the last month
    const ratings = await playerTrueSkillRatingModel
      .find({
        gamesCount: { $gte: 10 },
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
}
