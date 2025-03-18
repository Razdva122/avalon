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

export class MysteryAvatar {
  static id = 'mystery';

  static isAvailableForUser({ features }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return Boolean(features && features.easterEggRevealed);
  }
}

export const commonAvatars: IAvatar[] = [
  ServantAvatar,
  LadyAvatar,
  MerlinPureAvatar,
  AnimeMerlinPureAvatar,
  MysteryAvatar,
];
