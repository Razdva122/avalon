import type { IPlayer } from './player';
import type { THistoryResults } from './history';
import type { IGameSettingsWithRoles } from './settings';
import type { TAddonsStages, TAddonsData } from './addons';
import type { TLoyalty } from '../game/roles';
import type { TGameOptionsFeatures } from '../game/options';

export interface IVisualGameState {
  winner?: TLoyalty;
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
