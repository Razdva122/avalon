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

  @prop()
  public preVote?: TVoteOption;
}

/**
 * Pre vote
 */
export class PreVoteData {
  @prop({ required: true })
  public playerID!: string;

  @prop({ required: true })
  public value!: TVoteOption;
}
