import { IAvatar } from '@/user/avatars/abstract';
import { ACHIEVEMENT_TOP_PLAYER, ACHIEVEMENT_SECRET_HUNTER } from '@avalon/types';

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

export class MerlinPureAvatar {
  static id = 'merlin_pure';

  static isAvailableForUser({ features }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return Boolean(features && features.isHelper);
  }
}

export class AnimeMerlinPureAvatar {
  static id = 'anime/merlin_pure';

  static isAvailableForUser({ features }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return Boolean(features && features.isContributor);
  }
}

export class AnimeWitchAvatar {
  static id = 'anime/witch';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_TOP_PLAYER);
  }
}

export class MysteryAvatar {
  static id = 'mystery';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_SECRET_HUNTER);
  }
}

export const commonAvatars: IAvatar[] = [
  ServantAvatar,
  LadyAvatar,
  MerlinPureAvatar,
  AnimeMerlinPureAvatar,
  MysteryAvatar,
  AnimeWitchAvatar,
];
