import { prop } from '@typegoose/typegoose';

import { HistoryBase } from './base';
import type { TPlotCardNames } from '../addons';
import type { TMissionResult } from '../mission';

export type TGiveCardTarget = 'self' | 'player';

/**
 * Activating the plot map
 */
export class GiveCard extends HistoryBase {
  declare type: 'giveCard';

  @prop({ required: true })
  public target!: TGiveCardTarget;

  @prop({ required: true })
  public leaderID!: string;

  @prop({ required: true })
  public ownerID!: string;

  @prop({ required: true })
  public cardName!: TPlotCardNames;
}

/**
 * Play Lead To Victory card
 */
export class LeadToVictory extends HistoryBase {
  declare type: 'leadToVictory';

  @prop({ required: true })
  public prevLeaderID!: string;

  @prop({ required: true })
  public ownerID!: string;
}

/**
 * Restore Honor card history
 */
export class RestoreHonor extends HistoryBase {
  declare type: 'restoreHonor';

  @prop({ required: true })
  public prevOwnerID!: string;

  @prop({ required: true })
  public newOwnerID!: string;

  @prop({ required: true })
  public cardName!: TPlotCardNames;
}

/**
 * Ambush card history
 */
export class Ambush extends HistoryBase {
  declare type: 'ambush';

  @prop({ required: true })
  public ownerID!: string;

  @prop({ required: true })
  public targetID!: string;

  @prop()
  public result?: TMissionResult;
}

/**
 * King Returns card history
 */
export class KingReturns extends HistoryBase {
  declare type: 'kingReturns';

  @prop({ required: true })
  public ownerID!: string;
}

/**
 * Play Card history
 */
export class PlayCard extends HistoryBase {
  declare type: 'playCard';

  @prop({ required: true })
  public ownerID!: string;

  @prop({ required: true })
  public cardName!: TPlotCardNames;
}
