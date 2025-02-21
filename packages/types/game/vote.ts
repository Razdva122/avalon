import { prop } from '@typegoose/typegoose';

/**
 * Possible vote option
 */
export type TVoteOption = 'approve' | 'reject';

/**
 * Team member
 */
export class TeamMember {
  @prop({ required: true })
  public id!: string;

  @prop()
  public excalibur?: boolean;
}
