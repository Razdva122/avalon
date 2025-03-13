import { IAvatar } from '@/user/avatars/abstract';

export class ServantAvatar {
  static id = 'servant';

  static isAvailableForUser(): boolean {
    return true;
  }
}

export class LadyAvatar {
  static id = 'lady_of_lake';

  static isAvailableForUser({ user }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    const registrationDate = new Date(user.registrationDate);

    return registrationDate < new Date(Date.UTC(2026, 0, 1));
  }
}

export class MerlinAvatar {
  static id = 'merlin';

  static isAvailableForUser({ features }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return Boolean(features && features.isHelper);
  }
}

export class AnimeMerlinAvatar {
  static id = 'anime/merlin';

  static isAvailableForUser({ features }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return Boolean(features && features.isContributor);
  }
}

export const commonAvatars: IAvatar[] = [ServantAvatar, LadyAvatar, MerlinAvatar, AnimeMerlinAvatar];
