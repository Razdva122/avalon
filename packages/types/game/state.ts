import type { IPlayer } from './player';
import type { THistoryResults } from './history';
import type { IGameSettingsWithRoles } from './settings';
import type { TAddonsStages, TAddonsData } from './addons';
import type { TLoyalty } from '../game/roles';
import type { TGameOptionsFeatures } from '../game/options';

export interface IVisualGameState {
  result?: TGameResults;
  uuid: string;
  stage: TGameStage;
  vote: number;
  mission: number;
  settings: IGameSettingsWithRoles;
  history: THistoryResults[];
  players: IPlayer[];
  addonsData: TAddonsData;
  features: TGameOptionsFeatures;
}

export type TGameResults = {
  winner?: TLoyalty;
  reason: TGameEndReasons;
};

/**
 * Possible game stages
 */
export type TGameStage =
  | 'initialization'
  | 'votingForTeam'
  | 'hidden'
  | 'onMission'
  | 'selectTeam'
  | 'end'
  | TAddonsStages;

/**
 * Possible game results
 */
export type TGameEndReasons =
  | 'manualy'
  | 'evilTeamMissions'
  | 'goodTeamMissions'
  | 'missMerlin'
  | 'killMerlin'
  | 'missGuinevere'
  | 'killGuinevere'
  | 'missLovers'
  | 'killLovers';
