import { prop, modelOptions } from '@typegoose/typegoose';

/**
 * Possible history element
 */
export type THistoryType =
  | 'mission'
  | 'vote'
  | 'assassinate'
  | 'checkLoyalty'
  | 'revealLoyalty'
  | 'announceLoyalty'
  | 'switchResult'
  | 'switchLancelots'
  | 'giveCard'
  | 'preVote'
  | 'leadToVictory'
  | 'restoreHonor'
  | 'ambush'
  | 'kingReturns'
  | 'playCard';

/**
 * History element stages
 * `inactive` -> `active` -> `progress` -> `finished`
 */
export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

@modelOptions({
  schemaOptions: {
    discriminatorKey: 'type',
  },
})
export class HistoryBase {
  @prop({ required: true })
  public type!: THistoryType | 'hidden';
}

/**
 * Hidden element of history
 */
export class HiddenHistory extends HistoryBase {
  declare type: 'hidden';
}

/**
 * Action of player in mission
 */
export interface IAction {
  playerID: string;
  switchedBy?: string;
}

/**
 * Action of player in mission with result
 */
export interface IActionWithResult extends IAction {
  value: TMissionResult;
}

// Import this here to avoid circular dependencies
import type { TMissionResult } from '../mission';
