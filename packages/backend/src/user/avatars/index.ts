import { DBManager } from '@/db';
import { IAvatar } from '@/user/avatars/abstract';
import { commonAvatars } from '@/user/avatars/common';
import { ArgumentOfCallback } from '@avalon/types';

export class AvatarsManager {
  dbManager: DBManager;
  avatars: IAvatar[] = [...commonAvatars];

  constructor(dbManager: DBManager) {
    this.dbManager = dbManager;
  }

  async getAvailableAvatarsForUser(userID: string): Promise<ArgumentOfCallback<'getUserAvatars'>> {
    const [user, features] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
    ]);

    return this.avatars.map((avatar) => {
      const available = avatar.isAvailableForUser({ user, features });

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

    const [user, features] = await Promise.all([
      this.dbManager.getUserByID(userID),
      this.dbManager.getUserFeatures(userID),
    ]);

    if (!avatar.isAvailableForUser({ user, features })) {
      return { error: 'avatarNotAvailable' };
    }

    await this.dbManager.updateUserAvatar(userID, avatarID);

    return true;
  }
}
