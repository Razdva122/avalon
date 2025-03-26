import { prop } from '@typegoose/typegoose';

import type { TVisibleRole } from './roles';
import type { TMissionResult } from './mission';
import type { TVoteOption } from './vote';
import { AddonsFeatures } from './addons';

export class PlayerFeatures extends AddonsFeatures {
  /**
   * The leader, collects the mission
   */
  @prop()
  isLeader?: boolean;

  /**
   * Marked as a potential participant in the mission
   */
  @prop()
  isSelected?: boolean;

  /**
   * Suggested by the leader to send on a mission
   */
  @prop()
  isSent?: boolean;

  /**
   * True if the player has to do some action
   */
  @prop()
  waitForAction?: boolean;

  /**
   * Option if user pre-voted or force voted before voting
   */
  @prop()
  preVote?: TVoteOption;
}

export class Player {
  @prop({ required: true })
  index!: number;

  @prop({ required: true })
  id!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  role!: TVisibleRole;

  @prop({ required: true, _id: false })
  features!: PlayerFeatures;

  @prop({ type: () => [String], _id: false })
  validMissionsResult?: TMissionResult[];
}
