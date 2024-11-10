import type { IPlayerInGame, IPresetsForGame } from '@/core/game/interface';
import {
  TAdditionalAddonsData,
  TRolesAddonsData,
  AssassinAddon,
  LadyOfLakeAddon,
  ExcaliburAddon,
  LancelotsAddon,
  WitchAddon,
} from '@/core/game/addons';
import { TRolesWithAddons, TAdditionalAddons } from '@/core/game/addons';

/**
 * Game settings with different number of players
 */
export const gamesSettings: IPresetsForGame = {
  5: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
    ],
    players: {
      good: 3,
      evil: 2,
    },
    total: 5,
  },
  6: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
    ],
    players: {
      good: 4,
      evil: 2,
    },
    total: 6,
  },
  7: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 2 },
      { players: 4, failsRequired: 1 },
    ],
    players: {
      good: 4,
      evil: 3,
    },
    total: 7,
  },
  8: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: {
      good: 5,
      evil: 3,
    },
    total: 8,
  },
  9: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: {
      good: 6,
      evil: 3,
    },
    total: 9,
  },
  10: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: {
      good: 6,
      evil: 4,
    },
    total: 10,
  },
};

/**
 * Roles with addons for main game
 */
export const rolesWithAddons: Record<TRolesWithAddons, TRolesAddonsData> = {
  merlin: {
    addon: AssassinAddon,
    key: 'assassin',
    options: {
      merlin: [(player: IPlayerInGame) => player.role.role === 'merlin'],
    },
  },
  merlinPure: {
    addon: AssassinAddon,
    key: 'assassin',
    options: {
      merlin: [(player: IPlayerInGame) => player.role.role === 'merlinPure'],
    },
  },
  tristan: {
    addon: AssassinAddon,
    key: 'assassin',
    options: {
      lovers: [
        (player: IPlayerInGame) => player.role.role === 'tristan',
        (player: IPlayerInGame) => player.role.role === 'isolde',
      ],
    },
  },
  guinevere: {
    addon: AssassinAddon,
    key: 'assassin',
    options: {
      guinevere: [(player: IPlayerInGame) => player.role.role === 'guinevere'],
    },
  },
  goodLancelot: {
    addon: LancelotsAddon,
    key: 'lancelots',
  },
  witch: {
    addon: WitchAddon,
    key: 'witch',
  },
};

/**
 * Role-independent addons
 */
export const addons: Record<TAdditionalAddons, TAdditionalAddonsData> = {
  ladyOfLake: {
    addon: LadyOfLakeAddon,
    key: 'ladyOfLake',
  },
  excalibur: {
    addon: ExcaliburAddon,
    key: 'excalibur',
  },
};
