import { DBManager } from '@/db';
import { IAvatar } from '@/user/avatars/abstract';
import { commonAvatars } from '@/user/avatars/common';
import { ArgumentOfCallback } from '@avalon/types';
import { achievementsAvatars } from '@/user/avatars/achievements';

export class AvatarsManager {
  dbManager: DBManager;
  avatars: IAvatar[] = [...commonAvatars, ...achievementsAvatars];

  constructor(dbManager: DBManager) {
    this.dbManager = dbManager;
  }

  async getAvailableAvatarsForUser(userID: string): Promise<ArgumentOfCallback<'getUserAvatars'>> {
    const [user, features, achievements] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
      this.dbManager.getUserCompletedAchievements(userID),
    ]);

    return this.avatars.map((avatar) => {
      const available = avatar.isAvailableForUser({ user, features, achievements });

      return {
        id: avatar.id,
        available,
        info: avatar.getInfo?.({ user, features }),
      };
    });
  }

  async updateUserAvatar(userID: string, avatarID: string): Promise<ArgumentOfCallback<'updateUserAvatar'>> {
    const avatar = this.avatars.find((el) => el.id === avatarID);

    if (!avatar) {
      return { error: 'avatarNotExist' };
    }

    const [user, features, achievements] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
      this.dbManager.getUserCompletedAchievements(userID),
    ]);

    if (!avatar.isAvailableForUser({ user, features, achievements })) {
      return { error: 'avatarNotAvailable' };
    }

    await this.dbManager.updateUserAvatar(userID, avatarID);

    return true;
  }
}
