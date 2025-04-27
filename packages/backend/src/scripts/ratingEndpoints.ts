import { roleRatingModel, roleRankingsModel } from '../db/models';
import { TRoles } from '@avalon/types';
import { ServerSocket } from '@avalon/types';

/**
 * Registers rating-related socket endpoints
 * @param socket The socket instance
 */
export function registerRatingEndpoints(socket: ServerSocket): void {
  // Get roles that have users with ratings
  socket.on('getRolesWithRatings', (callback) => {
    console.log('Getting roles with ratings');
    try {
      roleRatingModel
        .aggregate([
          { $match: { rating: { $gt: 0 } } },
          { $group: { _id: '$role' } },
          { $project: { role: '$_id', _id: 0 } },
          { $sort: { role: 1 } },
        ])
        .then((roles) => {
          callback(roles.map((r) => r.role));
        })
        .catch((error) => {
          console.error('Error fetching roles with ratings:', error);
          callback({ error: 'Failed to fetch roles with ratings' });
        });
    } catch (error) {
      console.error('Error fetching roles with ratings:', error);
      callback({ error: 'Failed to fetch roles with ratings' });
    }
  });

  // Get leaderboard for a specific role
  socket.on('getRoleLeaderboard', (role: TRoles, callback) => {
    console.log(`Getting leaderboard for role: ${role}, limit: 20`);
    try {
      roleRatingModel
        .find({ role })
        .sort({ rank: 1 })
        .limit(20)
        .lean()
        .then((leaderboard) => {
          callback(leaderboard);
        })
        .catch((error) => {
          console.error('Error fetching role leaderboard:', error);
          callback({ error: 'Failed to fetch leaderboard' });
        });
    } catch (error) {
      console.error('Error fetching role leaderboard:', error);
      callback({ error: 'Failed to fetch leaderboard' });
    }
  });

  // Get ratings for a specific user
  socket.on('getUserRatings', (userID: string, callback) => {
    console.log(`Getting ratings for user: ${userID}`);
    try {
      roleRatingModel
        .find({ userID })
        .sort({ rating: -1, gamesCount: -1 })
        .lean()
        .then((ratings) => {
          callback(ratings);
        })
        .catch((error) => {
          console.error('Error fetching user ratings:', error);
          callback({ error: 'Failed to fetch user ratings' });
        });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      callback({ error: 'Failed to fetch user ratings' });
    }
  });

  // Get popular roles with at least minPlayers players
  socket.on('getPopularRoles', (minPlayers: number, callback) => {
    console.log(`Getting popular roles with at least ${minPlayers} players`);
    try {
      // Aggregate to count players per role with rating > 0
      roleRatingModel
        .aggregate([
          { $match: { rating: { $gt: 0 } } },
          { $group: { _id: '$role', playerCount: { $sum: 1 } } },
          { $match: { playerCount: { $gte: minPlayers } } },
          { $project: { role: '$_id', playerCount: 1, _id: 0 } },
          { $sort: { playerCount: -1 } },
        ])
        .then((popularRoles) => {
          callback(popularRoles);
        })
        .catch((error) => {
          console.error('Error fetching popular roles:', error);
          callback({ error: 'Failed to fetch popular roles' });
        });
    } catch (error) {
      console.error('Error fetching popular roles:', error);
      callback({ error: 'Failed to fetch popular roles' });
    }
  });

  // Get rating history for a user and role
  socket.on('getRatingHistory', (userID: string, role: TRoles, callback) => {
    console.log(`Getting rating history for user: ${userID}, role: ${role}, days: 30`);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      roleRankingsModel
        .find({
          date: { $gte: startDate },
        })
        .lean()
        .then((history) => {
          // Extract the user's ratings for the specified role from each snapshot
          const ratingHistory = history.map((snapshot) => {
            const userRating = snapshot.ratings.find((r) => r.userID === userID && r.role === role);
            return {
              date: snapshot.date,
              rating: userRating?.rating || null,
              rank: userRating?.rank || null,
            };
          });

          callback(ratingHistory);
        })
        .catch((error) => {
          console.error('Error fetching rating history:', error);
          callback({ error: 'Failed to fetch rating history' });
        });
    } catch (error) {
      console.error('Error fetching rating history:', error);
      callback({ error: 'Failed to fetch rating history' });
    }
  });

  // Get top players for all popular roles in a single request
  socket.on('getTopPlayersForPopularRoles', async (minPlayers: number, callback) => {
    console.log(`Getting top players for popular roles with at least ${minPlayers} players`);
    try {
      // First, get all popular roles
      const popularRoles = await roleRatingModel.aggregate([
        { $match: { rating: { $gt: 0 } } },
        { $group: { _id: '$role', playerCount: { $sum: 1 } } },
        { $match: { playerCount: { $gte: minPlayers } } },
        { $project: { role: '$_id', playerCount: 1, _id: 0 } },
        { $sort: { playerCount: -1 } },
      ]);

      // Then, for each popular role, get the top player
      const result = await Promise.all(
        popularRoles.map(async ({ role }) => {
          const topPlayers = await roleRatingModel.find({ role }).sort({ rank: 1 }).limit(1).lean();

          const topPlayer = topPlayers.length > 0 ? topPlayers[0] : null;
          return { role, topPlayer };
        }),
      );

      callback(result);
    } catch (error) {
      console.error('Error fetching top players for popular roles:', error);
      callback({ error: 'Failed to fetch top players for popular roles' });
    }
  });
}
