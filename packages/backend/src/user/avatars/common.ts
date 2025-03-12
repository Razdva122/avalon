import { IAvatar } from '@/user/avatars/abstract';
import { UserProfile } from '@avalon/types';

export class ServantAvatar {
  static id = 'servant';

  static isAvailableForUser(): boolean {
    return true;
  }
}

export class LadyAvatar {
  static id = 'lady_of_lake';

  static isAvailableForUser(user: UserProfile): boolean {
    const registrationDate = new Date(user.registrationDate);

    return registrationDate < new Date(Date.UTC(2026, 0, 1));
  }
}

export const commonAvatars: IAvatar[] = [ServantAvatar, LadyAvatar];
