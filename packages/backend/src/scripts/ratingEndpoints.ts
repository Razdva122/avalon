import { roleRatingModel, roleRankingsModel } from '../db/models';
import { TRoles } from '@avalon/types';
import { ServerSocket } from '@avalon/types';

/**
 * Registers rating-related socket endpoints
 * @param socket The socket instance
 */
export function registerRatingEndpoints(socket: ServerSocket): void {
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
      if (typeof callback === 'function') {
        callback({ error: 'Failed to fetch leaderboard' });
      }
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
      if (typeof callback === 'function') {
        callback({ error: 'Failed to fetch user ratings' });
      }
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
      if (typeof callback === 'function') {
        callback({ error: 'Failed to fetch rating history' });
      }
    }
  });
}
