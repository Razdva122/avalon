import { userProfileModel, roomModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const removeGamesWithInvalidUsers: Migration = {
  name: 'removeGamesWithInvalidUsers',
  async up() {
    // Get all user IDs from the userProfiles collection
    const userProfiles = await userProfileModel.find({}, { id: 1 }).lean();
    const validUserIds = new Set(userProfiles.map((profile) => profile.id));

    // Find all games
    const games = await roomModel.find({ stage: 'started' }).lean();

    // Track games to delete
    const gamesToDelete = [];

    // Check each game for players with invalid userIDs
    for (const game of games) {
      // Check if any player has an ID that doesn't exist in userProfiles
      const hasInvalidPlayer = game.players.some((player) => !validUserIds.has(player.id));

      if (hasInvalidPlayer) {
        gamesToDelete.push(game.roomID);
      }
    }

    console.log(`Found ${gamesToDelete.length} games with invalid users to delete`);

    // Delete the games with invalid players
    if (gamesToDelete.length > 0) {
      const result = await roomModel.deleteMany({ roomID: { $in: gamesToDelete } });
      console.log(`Deleted ${result.deletedCount} games with invalid users`);
    }
  },

  // Optional down method to restore deleted games (not implemented)
  async down() {
    console.log('This migration cannot be reversed as deleted games cannot be restored');
  },
};
