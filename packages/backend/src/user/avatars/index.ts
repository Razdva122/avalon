import { DBManager } from '@/db';
import { IAvatar } from '@/user/avatars/abstract';
import { commonAvatars } from '@/user/avatars/common';
import { UserProfile } from '@avalon/types';

export class AvatarsManager {
  dbManager: DBManager;
  avatars: IAvatar[] = [...commonAvatars];

  constructor(dbManager: DBManager) {
    this.dbManager = dbManager;
  }

  getAvailableAvatarsForUser(user: UserProfile): string[] {
    return this.avatars.filter((avatar) => avatar.isAvailableForUser(user)).map((el) => el.id);
  }

  async updateUserAvatar(userID: string, avatarID: string) {
    const avatar = this.avatars.find((el) => el.id === avatarID);

    if (!avatar) {
      return { error: 'avatarNotExist' };
    }

    const user = await this.dbManager.getUserByID(userID);

    if (!avatar.isAvailableForUser(user)) {
      return { error: 'avatarNotAvailable' };
    }

    await this.dbManager.updateUserAvatar(userID, avatarID);

    return true;
  }
}
