import type { TLoyalty, TOptionalRoles } from '@avalon/types';
import type { IGameAddon, MerlinAddon } from '@/game/addons';
import type { Character } from '@/roles';
import type { User } from '@/user';

import type { IMissionSettings } from '@avalon/types';

export type TGameStage = 'initialization' | 'votingForTeam' | 'onMission' | 'selectTeam' | 'selectMerlin' | 'end';

export interface IPresetsForGame {
	[key: number]: IGameSettings
}

export interface IGameSettings {
	missions: IMissionSettings[];
	players: {
		[key in TLoyalty]: number
	}
}

export interface IGameOptions {
	roles: {
		[key in TOptionalRoles]?: number;
	},
}

export interface IPlayerInGame {
	user: User,
	role: Character,

	/**
	 * Next player in game
	 */
	next: IPlayerInGame,

	features: IPlayerFeatures & {
		/**
		 * True if player assassin
		 */
		isAssassin: boolean;
	}
}

export interface IPlayerFeatures {
	/**
	 * The leader, collects the mission
	 */
	isLeader: boolean;

	/**
	 * Marked as a potential participant in the mission
	 */
	isSelected: boolean;

	/**
	 * Suggested by the leader to send on a mission
	 */
	isSent: boolean;
}

export type TAddonsArray = IGameAddon[];

export interface IGameAddons extends TAddonsArray {
	merlin?: MerlinAddon
}
