import { IAvatar } from '@/user/avatars/abstract';
import {
  ACHIEVEMENT_TOP_PLAYER,
  ACHIEVEMENT_SECRET_HUNTER,
  ACHIEVEMENT_STILL_WORTHY,
  ACHIEVEMENT_MISTAKES_HAPPEN,
  ACHIEVEMENT_SEER,
  ACHIEVEMENT_DARK_WINS,
  ACHIEVEMENT_LIGHT_WINS,
  ACHIEVEMENT_BODYGUARD,
  ACHIEVEMENT_WRONG_CHOICE,
  ACHIEVEMENT_USELESS_ROLE,
  ACHIEVEMENT_SERIAL_KILLER,
  ACHIEVEMENT_DETECTIVE,
  ACHIEVEMENT_UNDERCOVER_AGENT,
  ACHIEVEMENT_ASSASSIN_KILLS,
  ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
  ACHIEVEMENT_ALL_STANDARD_ROLES,
} from '@avalon/types';

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

export class ExcaliburAvatar {
  static id = 'excalibur';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_STILL_WORTHY);
  }
}

export class EvilAvatar {
  static id = 'evil';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_MISTAKES_HAPPEN);
  }
}

export class GoodAvatar {
  static id = 'good';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_SEER);
  }
}

export class OberonAvatar {
  static id = 'oberon';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_DARK_WINS);
  }
}

export class AnimeServantAvatar {
  static id = 'anime/servant';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_LIGHT_WINS);
  }
}

export class PercivalAvatar {
  static id = 'percival';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_BODYGUARD);
  }
}

export class MorganaAvatar {
  static id = 'morgana';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_WRONG_CHOICE);
  }
}

export class ClericAvatar {
  static id = 'cleric';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_USELESS_ROLE);
  }
}

export class LunaticAvatar {
  static id = 'lunatic';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_SERIAL_KILLER);
  }
}

export class MerlinAvatar {
  static id = 'merlin';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_DETECTIVE);
  }
}

export class AnimeMerlinAvatar {
  static id = 'anime/merlin';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_UNDERCOVER_AGENT);
  }
}

export class MinionAvatar {
  static id = 'minion';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_ASSASSIN_KILLS);
  }
}

export class AnimeMinionAvatar {
  static id = 'anime/minion';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_DIFFERENT_PLAYER_COUNT);
  }
}

export class AnimeTroublemakerAvatar {
  static id = 'anime/troublemaker';

  static isAvailableForUser({ achievements }: Parameters<IAvatar['isAvailableForUser']>[0]): boolean {
    return achievements.includes(ACHIEVEMENT_ALL_STANDARD_ROLES);
  }
}

export const achievementsAvatars: IAvatar[] = [
  MysteryAvatar,
  MinionAvatar,
  OberonAvatar,
  PercivalAvatar,
  MorganaAvatar,
  ClericAvatar,
  LunaticAvatar,
  MerlinAvatar,
  AnimeWitchAvatar,
  AnimeServantAvatar,
  AnimeMerlinAvatar,
  AnimeMinionAvatar,
  AnimeTroublemakerAvatar,
  ExcaliburAvatar,
  EvilAvatar,
  GoodAvatar,
];
