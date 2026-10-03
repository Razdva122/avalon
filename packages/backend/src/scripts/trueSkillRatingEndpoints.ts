import { playerTrueSkillRatingModel, gameTrueSkillResultModel, userFeaturesModel } from '../db/models';
import { hasPremium } from '@/support/premium';
import { supportTotalCents } from '@/support/repository';
import { ServerSocket } from '@avalon/types';
import { trueSkillCalculator } from './trueSkillCalculator';
import { TrueSkillLeaderboardEntry } from '@avalon/types/api/trueskill-sockets';
import { getBotProfile } from '@/ai/agents';
import type { PlayerTrueSkillRating } from '@avalon/types';
import { nextResetDate, resetRating } from './rating-operations';

async function resetCooldownMonths(userID: string): Promise<1 | 3> {
  const [total, features] = await Promise.all([
    supportTotalCents(userID),
    userFeaturesModel.findOne({ userID }).lean(),
  ]);
  return hasPremium(total, features) ? 1 : 3;
}

/**
 * Register TrueSkill rating endpoints
 * @param socket The socket instance
 */
export function registerTrueSkillRatingEndpoints(
  socket: ServerSocket,
  authenticatedUserID?: string,
  aiRating?: (id: string) => Promise<PlayerTrueSkillRating | undefined>,
): void {
  // Get player TrueSkill rating
  socket.on('getTrueSkillRating', async (userID: string, callback) => {
    if (getBotProfile(userID)) {
      try {
        const rating = await aiRating?.(userID);
        callback(rating ? { success: true, rating } : { success: false, error: 'AI profile rating unavailable' });
      } catch {
        callback({ success: false, error: 'AI profile rating unavailable' });
      }
      return;
    }
    const rating = await playerTrueSkillRatingModel.findOne({ userID }).lean();

    if (!rating) {
      // Accounts have no rating until their first rated game.
      callback({ success: true });
      return;
    }

    // Cooldown details are private, independent of public badge visibility.
    try {
      const months = userID === authenticatedUserID ? await resetCooldownMonths(userID) : undefined;
      callback({
        success: true,
        rating,
        ...(months
          ? { resetCooldownMonths: months, nextResetAvailableAt: nextResetDate(rating.lastResetAt, months) }
          : {}),
      });
    } catch {
      callback({ success: false, error: 'Failed to load rating reset availability' });
    }
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
        if (!authenticatedUserID || userID !== authenticatedUserID) {
          callback({ success: false, error: 'Unauthorized' });
          return;
        }
        // Получаем текущий рейтинг пользователя
        const rating = await playerTrueSkillRatingModel.findOne({ userID }).lean();

        if (!rating) {
          callback({
            success: false,
            error: 'Player rating not found',
          });
          return;
        }

        const months = await resetCooldownMonths(userID);
        const now = new Date();
        const nextResetAvailableAt = nextResetDate(rating.lastResetAt, months);
        if (nextResetAvailableAt && now < nextResetAvailableAt) {
          callback({ success: false, error: 'Rating reset cooldown is active', nextResetAvailableAt });
          return;
        }

        const result = await resetRating(userID, months);
        callback({ ...result, ...(result.success ? { message: 'Rating has been reset successfully' } : {}) });
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
