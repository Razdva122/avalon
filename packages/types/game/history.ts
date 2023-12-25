import type { TMissionResult, IMissionSettings } from './mission';
import type { TVoteOption } from './vote';
import type { TAssassinateResult } from './addons';

/**
 * Possible history element
 */
export type THistoryType = 'mission' | 'vote' | 'assassinate';

/**
 * History element stages
 * `inactive` -> `active` -> `progress` -> `finished`
 */
export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

export type THistoryResults = THistoryVote | THistoryMission | THistoryAssassinate;

/**
 * History vote data
 */
export type THistoryVote = {
  type: 'vote';
  result: TVoteOption;
  leaderID: string;
  votes: TVote[];
};

/**
 * History mission data
 */
export type THistoryMission = {
  type: 'mission';
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
  killed: string;
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
