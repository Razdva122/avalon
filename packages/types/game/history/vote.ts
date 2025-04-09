import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import { HistoryBase } from './base';
import { TeamMember, PreVoteData } from '../vote';
import type { TVoteOption } from '../vote';

/**
 * Vote of one player
 */
export class Vote {
  @prop({ required: true })
  public playerID!: string;

  @prop({ required: true })
  public onMission!: boolean;

  @prop({ required: true })
  public value!: TVoteOption;
}

/**
 * Result of anonymous voting
 */
export class AnonymousVoteResult {
  @prop({ required: true })
  public approve!: number;

  @prop({ required: true })
  public reject!: number;
}

/**
 * Pre-vote data
 */
export class PreVote extends HistoryBase {
  declare type: 'preVote';

  @prop({ required: true, type: () => [PreVoteData], _id: false })
  public votes!: PreVoteData[];
}

@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class HistoryVoteBase extends HistoryBase {
  declare type: 'vote';

  @prop({ required: true })
  public anonymous!: boolean;

  @prop({ required: true })
  public index!: number;

  @prop({ required: true })
  public result!: TVoteOption;

  @prop({ required: true })
  public leaderID!: string;

  @prop({ required: true, type: () => [TeamMember], _id: false })
  public team!: TeamMember[];

  @prop({ required: true })
  public forced!: boolean;

  @prop({ required: true, type: Schema.Types.Mixed, _id: false })
  public votes!: AnonymousVoteResult | Vote[];
}

export class AnonymousHistoryVote extends HistoryVoteBase {
  declare public anonymous: true;

  @prop({ required: true, _id: false })
  declare votes: AnonymousVoteResult;
}

export class HistoryVote extends HistoryVoteBase {
  declare public anonymous: false;

  @prop({ required: true, type: () => [Vote], _id: false })
  declare votes: Vote[];
}

/**
 * History vote data
 */
export type THistoryVote = AnonymousHistoryVote | HistoryVote;
