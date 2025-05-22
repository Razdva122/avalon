import { achievementModel, userAchievementModel, achievementStatsModel } from '../db/models';
import { ServerSocket } from '@avalon/types';

/**
 * Registers achievement-related socket endpoints
 * @param socket The socket instance
 */
export function registerAchievementEndpoints(socket: ServerSocket): void {
  // Get all achievements
  socket.on('getAllAchievements', (callback) => {
    console.log('Getting all achievements');
    try {
      achievementModel
        .find()
        .lean()
        .then((achievements) => {
          callback({
            success: true,
            achievements,
          });
        })
        .catch((error) => {
          console.error('Error fetching achievements:', error);
          callback({
            success: false,
            error: 'Failed to fetch achievements',
          });
        });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      callback({
        success: false,
        error: 'Failed to fetch achievements',
      });
    }
  });

  // Get user achievements
  socket.on('getUserAchievements', (userID: string, callback) => {
    console.log(`Getting achievements for user: ${userID}`);
    try {
      userAchievementModel
        .find({ userID })
        .lean()
        .then((userAchievements) => {
          callback({
            success: true,
            userAchievements,
          });
        })
        .catch((error) => {
          console.error('Error fetching user achievements:', error);
          callback({
            success: false,
            error: 'Failed to fetch user achievements',
          });
        });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      callback({
        success: false,
        error: 'Failed to fetch user achievements',
      });
    }
  });

  // Get achievement stats
  socket.on('getAchievementStats', (callback) => {
    console.log('Getting achievement stats');
    try {
      achievementStatsModel
        .find()
        .lean()
        .then((stats) => {
          callback({
            success: true,
            stats,
          });
        })
        .catch((error) => {
          console.error('Error fetching achievement stats:', error);
          callback({
            success: false,
            error: 'Failed to fetch achievement stats',
          });
        });
    } catch (error) {
      console.error('Error fetching achievement stats:', error);
      callback({
        success: false,
        error: 'Failed to fetch achievement stats',
      });
    }
  });
}
