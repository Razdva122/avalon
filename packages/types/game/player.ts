import { prop } from '@typegoose/typegoose';

import type { TVisibleRole } from './roles';
import type { TMissionResult } from './mission';
import type { TAddonsFeatures } from './addons';

export class Player {
  @prop({ required: true })
  index!: number;

  @prop({ required: true })
  id!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  role!: TVisibleRole;

  @prop({ required: true })
  features!: IPlayerFeatures;

  @prop({ type: () => [String] })
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
