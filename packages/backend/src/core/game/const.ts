import type { IPresetsForGame } from '@/core/game/interface';
import {
  TAdditionalAddonsConstructor,
  TRolesAddonsConstructor,
  MerlinAddon,
  LadyOfLakeAddon,
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
export const rolesWithAddons: Record<TRolesWithAddons, TRolesAddonsConstructor> = {
  merlin: MerlinAddon,
};

/**
 * Role-independent addons
 */
export const addons: Record<TAdditionalAddons, TAdditionalAddonsConstructor> = {
  ladyOfLake: LadyOfLakeAddon,
};
