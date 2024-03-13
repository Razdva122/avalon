import type { TMissionResult, IMissionSettings } from './mission';
import type { TVoteOption, TTeamMember } from './vote';
import type { TAssassinateResult } from './addons';
import type { TLoyalty } from './roles';
import type { TAssassinateType } from './addons/assassin';

/**
 * Possible history element
 */
export type THistoryType = 'mission' | 'vote' | 'assassinate' | 'checkLoyalty' | 'switchResult';

/**
 * History element stages
 * `inactive` -> `active` -> `progress` -> `finished`
 */
export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

export type THistoryResults = THistoryVote | IHistoryMission | IHistoryAssassinate | ICheckLoyalty | ISwitchResult;

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
 * History mission data
 */
export interface IHistoryMission {
  type: 'mission';
  index: number;
  result: TMissionResult;
  settings: IMissionSettings;
  leaderID: string;
  actions: IAction[] | IActionWithResult[];
  fails: number;
}

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

export interface ISwitchResult {
  type: 'switchResult';
  switcherID: string;
  targetID?: string;
  result?: TMissionResult;
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
