import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import { Schema } from 'mongoose';

import type { TMissionResult, MissionSettings } from './mission';
import { TeamMember, PreVoteData } from './vote';
import type { TVoteOption } from './vote';
import type { TAssassinateResult, TPlotCardNames } from './addons';
import type { TLoyalty, TRoles } from './roles';
import type { TAssassinateType } from './addons/assassin';

/**
 * Possible history element
 */
export type THistoryType =
  | 'mission'
  | 'vote'
  | 'assassinate'
  | 'checkLoyalty'
  | 'switchResult'
  | 'switchLancelots'
  | 'giveCard'
  | 'preVote'
  | 'leadToVictory'
  | 'restoreHonor'
  | 'ambush'
  | 'kingReturns';

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

export type THistoryResults =
  | AnonymousHistoryVote
  | HistoryVote
  | HistoryMission
  | HistoryMissionHidden
  | HistoryAssassinate
  | CheckLoyalty
  | SwitchResult
  | HiddenHistory
  | SwitchLancelots
  | HiddenHistory
  | GiveCard
  | PreVote
  | LeadToVictory
  | RestoreHonor
  | Ambush
  | KingReturns;

/**
 * Pre-vote data
 */
export class PreVote extends HistoryBase {
  declare type: 'preVote';

  @prop({ required: true, type: () => [PreVoteData], _id: false })
  public votes!: PreVoteData[];
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

/**
 * General history mission data
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class HistoryMissionBase extends HistoryBase {
  declare type: 'mission';

  @prop({ required: true })
  public hidden!: boolean;

  @prop({ required: true })
  public index!: number;

  @prop({ required: true, _id: false })
  public settings!: MissionSettings;

  @prop()
  public leaderID?: string;

  @prop({ required: true, type: Schema.Types.Mixed, _id: false })
  public actions!: IAction[] | IActionWithResult[];

  @prop()
  public result?: TMissionResult;

  @prop()
  public fails?: number;
}

/**
 * Complete history mission data
 */
export class HistoryMission extends HistoryMissionBase {
  declare hidden: false;
  declare result: TMissionResult;
  declare fails: number;
}

/**
 * Hidden history mission data
 */
export class HistoryMissionHidden extends HistoryMissionBase {
  declare hidden: true;
  declare result: undefined;
  declare fails: undefined;
}

/**
 * History mission data
 */
export type THistoryMission = HistoryMissionHidden | HistoryMission;

/**
 * History assassinate data
 */
export class HistoryAssassinate extends HistoryBase {
  declare type: 'assassinate';

  @prop({ required: true })
  public result!: TAssassinateResult;

  @prop({ required: true })
  public assassinID!: string;

  @prop({ required: true })
  public assassinateType!: TAssassinateType;

  @prop({ required: true, type: () => [String] })
  public killedIDs!: string[];
}

/**
 * Check loyalty data
 */
export class CheckLoyalty extends HistoryBase {
  declare type: 'checkLoyalty';

  @prop({ required: true })
  public validatorID!: string;

  @prop({ required: true })
  public inspectedID!: string;

  @prop({ required: true })
  public result!: TLoyalty | TRoles;

  @prop()
  public visibleLoyalty?: TLoyalty | TRoles;
}

/**
 * Change of mission action
 */
export class SwitchResult extends HistoryBase {
  declare type: 'switchResult';

  @prop({ required: true })
  public switcherID!: string;

  @prop()
  public targetID?: string;

  @prop()
  public result?: TMissionResult;
}

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
 * Hidden element of history
 */
export class HiddenHistory extends HistoryBase {
  declare type: 'hidden';
}

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
  public good!: string;

  @prop({ required: true })
  public evil!: string;
}

/**
 * Switch lancelots data
 */
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class SwitchLancelots extends HistoryBase {
  declare type: 'switchLancelots';

  @prop()
  public lancelotsIDs?: LancelotsIDs;

  @prop({ required: true, type: Schema.Types.Mixed })
  public switches!: Array<boolean | null>;

  @prop({ required: true })
  public pointer!: number;

  @prop({ required: true })
  public result!: boolean;
}
