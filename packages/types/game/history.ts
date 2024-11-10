import type { TMissionResult, IMissionSettings } from './mission';
import type { TVoteOption, TTeamMember } from './vote';
import type { TAssassinateResult } from './addons';
import type { TLoyalty } from './roles';
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
  | ICheckLoyalty
  | ISwitchResult
  | IHiddenHistory
  | ISwitchLancelots;

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
  settings: IMissionSettings;
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
export interface ICheckLoyalty {
  type: 'checkLoyalty';
  validatorID: string;
  inspectedID: string;
  result: TLoyalty;
  realLoyalty?: TLoyalty;
}

/**
 * Change of mission action
 */
export interface ISwitchResult {
  type: 'switchResult';
  switcherID: string;
  targetID?: string;
  result?: TMissionResult;
}

/**
 * Hidden element of history
 */
export interface IHiddenHistory {
  type: 'hidden';
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

/**
 * Switch lancelots data
 */
export interface ISwitchLancelots {
  type: 'switchLancelots';
  lancelotsIDs?: {
    good: string;
    evil: string;
  };
  switches: Array<boolean | null>;
  pointer: number;
  result: boolean;
}
