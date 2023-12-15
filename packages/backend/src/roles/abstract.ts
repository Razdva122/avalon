import type { TVisibility } from '@/roles/interface';
import type { TRoles, TLoyalty, TMissionResult } from '@avalon/types';
import { evilRoles, goodRoles } from '@/roles';

export abstract class Character {
	/**
	 * Real role of character
	 */
	abstract role: TRoles;

	/**
	 * The role that the player sees himself
	 */
	abstract selfRole: TRoles;

	/**
	 * The team the player plays in
	 */
	abstract loyalty: TLoyalty;

	/**
	 * Visibility of other roles for this character
	 */
	abstract visibility: TVisibility;

	/**
	 * Possible mission results
	 */
	get validMissionResult(): TMissionResult[] {
		if (this.loyalty === 'good') {
			return ['success'];
		}

		return ['fail', 'success'];
	}

	/**
	 * Makes the roles visible, useful at the stages of the game when some of the roles are revealed
	 */
	makeRolesVisible(loyalty?: TLoyalty): void {
		const makeRoleVisible = (roleName: TRoles) => {
			this.visibility[roleName] = roleName;
		};

		if (loyalty !== 'evil') {
			(<(keyof typeof goodRoles)[]>Object.keys(goodRoles)).forEach(makeRoleVisible);
		}

		if (loyalty !== 'good') {
			(<(keyof typeof evilRoles)[]>Object.keys(evilRoles)).forEach(makeRoleVisible);
		}
	}
}
