import type { IPresetsForGame } from '@/game/interface';
import { TAddonsConstructor, MerlinAddon } from '@/game/addons';
import { TRolesWithAddons } from '@/game/addons';

/**
 * Game settings with different number of players
 */
export const gamesSettings: IPresetsForGame = {
	5: {
		missions: [
			{players: 2, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 2, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 3, failsRequired: 1},
		],
		players: {
			good: 3,
			evil: 2
		}
	},
	6: {
		missions: [
			{players: 2, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 1},
		],
		players: {
			good: 3,
			evil: 3
		}
	},
	7: {
		missions: [
			{players: 2, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 2},
			{players: 4, failsRequired: 1},
		],
		players: {
			good: 4,
			evil: 3
		}
	},
	8: {
		missions: [
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 5, failsRequired: 2},
			{players: 5, failsRequired: 1},
		],
		players: {
			good: 5,
			evil: 3
		}
	},
	9: {
		missions: [
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 5, failsRequired: 2},
			{players: 5, failsRequired: 1},
		],
		players: {
			good: 6,
			evil: 3
		}
	},
	10: {
		missions: [
			{players: 3, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 4, failsRequired: 1},
			{players: 5, failsRequired: 2},
			{players: 5, failsRequired: 1},
		],
		players: {
			good: 6,
			evil: 4
		}
	}
};

/**
 * Roles with addons for main game
 */
export const rolesWithAddons: Record<TRolesWithAddons, TAddonsConstructor> = {
	merlin: MerlinAddon
};
