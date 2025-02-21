import { prop } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import type { TMissionResult, MissionSettings } from './mission';
import type { TVoteOption, TTeamMember } from './vote';
import type { TAssassinateResult } from './addons';
import type { TLoyalty, TRoles } from './roles';
import type { TAssassinateType } from './addons/assassin';

/**
 * Possible history element
 */
export type THistoryType = 'mission' | 'vote' | 'assassinate' | 'checkLoyalty' | 'switchResult' | 'switchLancelots';

/**
 * History element stages
 * `inactive` -> `active` -> `progress` -> `finished`
 */
export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

export type THistoryResults =
  | THistoryVote
  | THistoryMission
  | IHistoryAssassinate
  | CheckLoyalty
  | SwitchResult
  | HiddenHistory
  | SwitchLancelots;

/**
 * History vote data
 */
export type THistoryVote = {
  type: 'vote';
  index: number;
  result: TVoteOption;
  leaderID: string;
  team: TTeamMember[];
  forced: boolean;
} & THistoryVoteVisibility;

export type THistoryVoteVisibility =
  | { anonymous: true; votes: { approve: number; reject: number } }
  | { anonymous: false; votes: TVote[] };

/**
 * General history mission data
 */
interface IHistoryMissionCore {
  type: 'mission';
  index: number;
  settings: MissionSettings;
  leaderID?: string;
  actions?: IAction[] | IActionWithResult[];
}

/**
 * Complete history mission data
 */
export interface IHistoryMissionComplete extends IHistoryMissionCore {
  hidden?: undefined;
  result: TMissionResult;
  fails: number;
}

/**
 * Hidden history mission data
 */
export interface IHistoryMissionHidden extends IHistoryMissionCore {
  hidden: true;
  result: undefined;
  fails: undefined;
}

/**
 * History mission data
 */
export type THistoryMission = IHistoryMissionHidden | IHistoryMissionComplete;

/**
 * History assassinate data
 */
export interface IHistoryAssassinate {
  type: 'assassinate';
  result: TAssassinateResult;
  assassinID: string;
  assassinateType: TAssassinateType;
  killedIDs: string[];
}

/**
 * Check loyalty data
 */
export class CheckLoyalty {
  @prop({ required: true })
  type!: 'checkLoyalty';

  @prop({ required: true })
  validatorID!: string;

  @prop({ required: true })
  inspectedID!: string;

  @prop({ required: true })
  result!: TLoyalty | TRoles;

  @prop()
  visibleLoyalty?: TLoyalty | TRoles;
}

/**
 * Change of mission action
 */
export class SwitchResult {
  @prop({ required: true })
  type!: 'switchResult';

  @prop({ required: true })
  switcherID!: string;

  @prop()
  targetID?: string;

  @prop()
  result?: TMissionResult;
}

/**
 * Hidden element of history
 */
export class HiddenHistory {
  @prop({ required: true })
  type!: 'hidden';
}

/**
 * Vote of one player
 */
export type TVote = {
  playerID: string;
  onMission: boolean;
  value: TVoteOption;
};

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

export class LancelotsIDs {
  @prop({ required: true })
  good!: string;

  @prop({ required: true })
  evil!: string;
}

/**
 * Switch lancelots data
 */
export class SwitchLancelots {
  @prop({ required: true })
  type!: 'switchLancelots';

  @prop()
  lancelotsIDs?: LancelotsIDs;

  @prop({ required: true, type: Schema.Types.Mixed })
  switches!: Array<boolean | null>;

  @prop({ required: true })
  pointer!: number;

  @prop({ required: true })
  result!: boolean;
}
