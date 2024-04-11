import type { TVisibility } from '@/core/roles/interface';
import type { TRoles, TLoyalty, TMissionResult } from '@avalon/types';

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
   * Loyalty during various checks
   */
  get visibleLoylaty(): TLoyalty {
    return this.loyalty;
  }
}
