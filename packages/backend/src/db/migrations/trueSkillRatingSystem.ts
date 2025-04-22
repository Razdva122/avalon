import {
  playerTrueSkillRatingModel,
  trueSkillRatingHistoryModel,
  gameTrueSkillResultModel,
  roomModel,
} from '@/db/models';
import { Migration } from '@/db/migrations/interface';
import { trueSkillCalculator } from '@/scripts/trueSkillCalculator';
import { VisualGameState } from '@avalon/types';

export const trueSkillRatingSystem: Migration = {
  name: 'trueSkillRatingSystem',
  async up() {
    console.log('Starting TrueSkill rating system migration...');

    // Check if collections have documents - if they do, assume migration has already run
    try {
      // Check if any of the collections have documents
      const playerRatingsCount = await playerTrueSkillRatingModel.countDocuments();
      const gameResultsCount = await gameTrueSkillResultModel.countDocuments();
      const historyCount = await trueSkillRatingHistoryModel.countDocuments();

      if (playerRatingsCount > 0 || gameResultsCount > 0 || historyCount > 0) {
        console.log(
          `TrueSkill data already exists (Players: ${playerRatingsCount}, Games: ${gameResultsCount}, History: ${historyCount}), skipping migration`,
        );
        return;
      }
    } catch (error) {
      console.error('Error checking collections:', error);
      // Continue with migration if there was an error checking collections
    }

    // Create indexes for better performance
    await playerTrueSkillRatingModel.collection.createIndexes([
      { key: { userID: 1 }, unique: true },
      { key: { mu: -1 } },
      { key: { conservativeRating: -1 } },
    ]);

    await gameTrueSkillResultModel.collection.createIndex({ gameID: 1 }, { unique: true });

    // Create index for history model
    await trueSkillRatingHistoryModel.collection.createIndex({ date: -1 });

    // Check if we already have TrueSkill ratings
    const trueSkillRatingsCount = await playerTrueSkillRatingModel.countDocuments();

    if (trueSkillRatingsCount > 0) {
      console.log(`Found ${trueSkillRatingsCount} existing TrueSkill ratings, skipping backfill`);
      return;
    }

    // Get all completed games
    const games = await roomModel
      .find({
        'game.result': { $exists: true },
        'game.result.reason': { $ne: 'manualy' },
      })
      .lean();

    console.log(`Found ${games.length} games to process for TrueSkill ratings backfill`);

    if (games.length === 0) {
      console.log('No games to process');
      return;
    }

    // Create a map for quick lookup of current ratings
    const ratingsMap = new Map<string, { mu: number; sigma: number; gamesCount: number }>();

    // Process each game
    for (const room of games) {
      try {
        const game = room.game as VisualGameState;
        const gameDate = room.startAt ? new Date(room.startAt) : new Date();

        // Skip games without results
        if (!game.result || !game.result.winner) {
          continue;
        }

        // Calculate TrueSkill changes
        const trueSkillChanges = trueSkillCalculator.calculateTrueSkillChangesForGame(game, ratingsMap);

        if (trueSkillChanges.length === 0) {
          continue;
        }

        // Store game TrueSkill result - use updateOne with upsert to handle potential duplicates
        await gameTrueSkillResultModel.updateOne(
          { gameID: game.uuid },
          {
            $setOnInsert: {
              gameID: game.uuid,
              playedAt: gameDate,
              playerChanges: trueSkillChanges,
            },
          },
          { upsert: true },
        );

        // Update player ratings
        for (const change of trueSkillChanges) {
          // Update in-memory map for subsequent games
          ratingsMap.set(change.userID, {
            mu: change.newMu,
            sigma: change.newSigma,
            gamesCount: (ratingsMap.get(change.userID)?.gamesCount || 0) + 1,
          });

          // Calculate conservative rating
          const conservativeRating = trueSkillCalculator.calculateConservativeRating(change.newMu, change.newSigma);

          // Update in database
          await playerTrueSkillRatingModel.updateOne(
            { userID: change.userID },
            {
              $set: {
                mu: change.newMu,
                sigma: change.newSigma,
                conservativeRating, // Store the calculated conservative rating
                lastPlayedAt: gameDate,
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
      } catch (error) {
        console.error(`Error processing game:`, error);
      }
    }

    console.log(`TrueSkill rating system migration completed. Processed ${games.length} games.`);
  },

  async down() {
    // Drop TrueSkill rating collections
    await playerTrueSkillRatingModel.collection.drop();
    await trueSkillRatingHistoryModel.collection.drop();
    await gameTrueSkillResultModel.collection.drop();

    console.log('TrueSkill rating system migration reverted');
  },
};
