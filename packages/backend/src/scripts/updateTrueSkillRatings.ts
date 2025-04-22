import { playerTrueSkillRatingModel, trueSkillRatingHistoryModel, gameTrueSkillResultModel } from '../db/models';
import { trueSkillCalculator } from './trueSkillCalculator';
import { VisualGameState } from '@avalon/types';
import { MIN_GAMES_FOR_LEADERBOARD } from '@avalon/types/stats/trueskill-constants';

/**
 * Updates TrueSkill for a single game
 * This can be called immediately when a game ends
 */
export async function updateTrueSkillForGame(gameState: VisualGameState): Promise<void> {
  // Check if this game already has TrueSkill calculated
  const existingResult = await gameTrueSkillResultModel.findOne({ gameID: gameState.uuid });
  if (existingResult) {
    console.log(`TrueSkill already calculated for game ${gameState.uuid}`);
    return;
  }

  // Get current ratings for all players
  const playerIds = gameState.players.map((p) => p.id);
  const playerRatings = await playerTrueSkillRatingModel
    .find({
      userID: { $in: playerIds },
    })
    .lean();

  // Create a map for quick lookup
  const ratingsMap = new Map<string, { mu: number; sigma: number; gamesCount: number }>();
  playerRatings.forEach((pr) => {
    ratingsMap.set(pr.userID, { mu: pr.mu, sigma: pr.sigma, gamesCount: pr.gamesCount });
  });

  // Calculate TrueSkill changes
  const trueSkillChanges = trueSkillCalculator.calculateTrueSkillChangesForGame(gameState, ratingsMap);

  if (trueSkillChanges.length === 0) {
    console.log(`No TrueSkill changes for game ${gameState.uuid}`);
    return;
  }

  // Store game TrueSkill result - use updateOne with upsert to handle potential duplicates
  await gameTrueSkillResultModel.updateOne(
    { gameID: gameState.uuid },
    {
      $setOnInsert: {
        gameID: gameState.uuid,
        playedAt: new Date(),
        playerChanges: trueSkillChanges,
      },
    },
    { upsert: true },
  );

  // Update player ratings
  for (const change of trueSkillChanges) {
    // Calculate conservative ratings
    const newConservativeRating = trueSkillCalculator.calculateConservativeRating(change.newMu, change.newSigma);

    // Update in database
    await playerTrueSkillRatingModel.updateOne(
      { userID: change.userID },
      {
        $set: {
          mu: change.newMu,
          sigma: change.newSigma,
          conservativeRating: newConservativeRating, // Also store the conservative rating
          lastPlayedAt: new Date(),
          updatedAt: new Date(),
        },
        $inc: {
          gamesCount: 1,
          wins: change.won ? 1 : 0,
          losses: change.won ? 0 : 1,
        },
      },
      { upsert: true },
    );
  }

  console.log(`Processed TrueSkill changes for game ${gameState.uuid}`);
}

/**
 * Creates a snapshot of current TrueSkill ratings for historical tracking
 */
export async function createTrueSkillRatingSnapshot(): Promise<void> {
  // Get all ratings
  const allRatings = await playerTrueSkillRatingModel
    .find({ gamesCount: { $gte: MIN_GAMES_FOR_LEADERBOARD } }) // Only include players with enough games
    .sort({ mu: -1 }) // Sort by mu (skill) descending
    .lean();

  // Calculate conservative rating and assign ranks
  const ratingsWithRank = allRatings.map((rating, index) => {
    const conservativeRating = trueSkillCalculator.calculateConservativeRating(rating.mu, rating.sigma);
    return {
      userID: rating.userID,
      mu: rating.mu,
      sigma: rating.sigma,
      conservativeRating,
      rank: index + 1,
    };
  });

  ratingsWithRank.sort((a, b) => b.mu - a.mu);

  // Re-assign ranks after sorting by conservative rating
  ratingsWithRank.forEach((rating, index) => {
    rating.rank = index + 1;
  });

  // Store snapshot
  await trueSkillRatingHistoryModel.create({
    date: new Date(),
    ratings: ratingsWithRank,
  });

  console.log(`Created TrueSkill rating snapshot with ${ratingsWithRank.length} players`);
}
