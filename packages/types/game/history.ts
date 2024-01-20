import type { TMissionResult, IMissionSettings } from './mission';
import type { TVoteOption } from './vote';
import type { TAssassinateResult } from './addons';
import type { TLoyalty } from './roles';

/**
 * Possible history element
 */
export type THistoryType = 'mission' | 'vote' | 'assassinate' | 'checkLoyalty';

/**
 * History element stages
 * `inactive` -> `active` -> `progress` -> `finished`
 */
export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

export type THistoryResults = THistoryVote | THistoryMission | THistoryAssassinate | TCheckLoyalty;

/**
 * History vote data
 */
export type THistoryVote = {
  type: 'vote';
  index: number;
  result: TVoteOption;
  leaderID: string;
  forced: boolean;
  votes: TVote[];
};

/**
 * History mission data
 */
export type THistoryMission = {
  type: 'mission';
  index: number;
  result: TMissionResult;
  settings: IMissionSettings;
  leaderID: string;
  actions: TAction[] | TActionWithResult[];
  fails: number;
};

/**
 * History assassinate data
 */
export type THistoryAssassinate = {
  type: 'assassinate';
  result: TAssassinateResult;
  assassinID: string;
  killedID: string;
};

/**
 * Check loyalty data
 */
export type TCheckLoyalty = {
  type: 'checkLoyalty';
  validatorID: string;
  inspectedID: string;
  result: TLoyalty;
};

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
export type TAction = {
  playerID: string;
};

/**
 * Action of player in mission with result
 */
export type TActionWithResult = {
  value: TMissionResult;
} & TAction;
