import { roleRatingModel, userFeaturesModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';
import { TRoles } from '@avalon/types';
import { startCase } from 'lodash';

export const addTop1Avatar: Migration = {
  name: 'addTop1Avatar',
  async up() {
    // Find all users who have a rank of 1 in any role and rating > 0
    const topRankings = await roleRatingModel
      .find({
        rank: 1,
        rating: { $gt: 0 },
      })
      .lean();

    // Group by userID to handle users who have top-1 in multiple roles
    const userTopRoles: Record<string, { role: TRoles; date: Date }[]> = {};

    topRankings.forEach((ranking) => {
      if (!userTopRoles[ranking.userID]) {
        userTopRoles[ranking.userID] = [];
      }

      userTopRoles[ranking.userID].push({
        role: ranking.role,
        date: ranking.updatedAt,
      });
    });

    // Update each user's features with top1info
    for (const [userID, topRoles] of Object.entries(userTopRoles)) {
      // Sort by date to get the most recent top-1 achievement
      topRoles.sort((a, b) => b.date.getTime() - a.date.getTime());
      const mostRecent = topRoles[0];

      // Format the date as DD.MM.YYYY
      const formattedDate = mostRecent.date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Format the role name using startCase
      const formattedRole = startCase(mostRecent.role);

      // Create the top1info string in the format "TOP-1 'Heroname' DATE"
      const top1info = `TOP-1 "${formattedRole}" ${formattedDate}`;

      // First check if the user features document exists
      const userFeatures = await userFeaturesModel.findOne({ userID });

      if (!userFeatures) {
        // If it doesn't exist, create a new one with top1info
        await userFeaturesModel.create({ userID, top1info });
      } else if (!userFeatures.top1info) {
        // If it exists but doesn't have top1info, update it
        await userFeaturesModel.updateOne({ userID }, { $set: { top1info } });
      }
    }

    console.log(`Updated top1info for ${Object.keys(userTopRoles).length} users`);
  },
};
