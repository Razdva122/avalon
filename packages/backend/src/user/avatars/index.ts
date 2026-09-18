import { DBManager } from '@/db';
import { IAvatar } from '@/user/avatars/abstract';
import { commonAvatars } from '@/user/avatars/common';
import { ArgumentOfCallback } from '@avalon/types';
import { achievementsAvatars } from '@/user/avatars/achievements';
import { PREMIUM_AVATAR_IDS } from '@avalon/types/user/avatars';
import { hasPremium } from '@/support/premium';
import { supportTotalCents } from '@/support/repository';

const premiumAvatars: IAvatar[] = PREMIUM_AVATAR_IDS.map((id) => ({
  id,
  premium: true,
  isAvailableForUser: ({ premium }) => premium === true,
}));

export class AvatarsManager {
  dbManager: DBManager;
  avatars: IAvatar[] = [...commonAvatars, ...premiumAvatars, ...achievementsAvatars];

  constructor(dbManager: DBManager) {
    this.dbManager = dbManager;
  }

  async getAvailableAvatarsForUser(userID: string): Promise<ArgumentOfCallback<'getUserAvatars'>> {
    const [user, features, achievements, total] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
      this.dbManager.getUserCompletedAchievements(userID),
      supportTotalCents(userID),
    ]);

    return this.avatars.map((avatar) => {
      const available = avatar.isAvailableForUser({
        user,
        features,
        achievements,
        premium: hasPremium(total, features),
      });

      return {
        id: avatar.id,
        available,
        ...(avatar.premium ? { premium: true } : {}),
        info: avatar.getInfo?.({ user, features }),
      };
    });
  }

  async updateUserAvatar(userID: string, avatarID: string): Promise<ArgumentOfCallback<'updateUserAvatar'>> {
    const avatar = this.avatars.find((el) => el.id === avatarID);

    if (!avatar) {
      return { error: 'avatarNotExist' };
    }

    const [user, features, achievements, total] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
      this.dbManager.getUserCompletedAchievements(userID),
      avatar.premium ? supportTotalCents(userID) : Promise.resolve(0),
    ]);

    if (!avatar.isAvailableForUser({ user, features, achievements, premium: hasPremium(total, features) })) {
      return { error: 'avatarNotAvailable' };
    }

    await this.dbManager.updateUserAvatar(userID, avatarID);

    return true;
  }
}
