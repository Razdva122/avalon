import type { TVisibleRole } from './roles';
import type { TMissionResult } from './mission';
import type { TAddonsFeatures } from './addons';

export interface IPlayer {
  id: string;
  name: string;
  role: TVisibleRole;
  features: IPlayerFeatures;
  validMissionsResult?: TMissionResult[];
}

export interface IPlayerFeatures extends TAddonsFeatures {
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
   * True if the player has to do some action
   */
  waitForAction?: boolean;
}
