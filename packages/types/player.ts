import type { TVisibleRole } from './roles';

export interface IPlayer {
	id: string;
	name: string;
	role: TVisibleRole;
	features: IPlayerFeatures & {
		waitForAction?: boolean;
	}
}

export interface IPlayerFeatures {
	/**
	 * The leader, collects the mission
	 */
	isLeader?: boolean;

	/**
	 * Marked as a potential participant in the mission
	 */
	isSelected?: boolean;

	/**
	 * Suggested by the leader to send on a mission
	 */
	isSent?: boolean;

	/**
	 * True if player assassin
	 */
	isAssassin?: boolean;
}

