import type { IPlayer } from './player';
import type { THistoryResults } from './history';
import type { IGameSettings } from './settings';
import type { TAddonsStages } from './addons';

export interface IVisualGameState {
  uuid: string;
  stage: TGameStage;
  vote: number;
  mission: number;
  settings: IGameSettings;
  history: THistoryResults[];
  players: IPlayer[];
}

/**
 * Possible game stages
 */
export type TGameStage = 'initialization' | 'votingForTeam' | 'onMission' | 'selectTeam' | 'end' | TAddonsStages;
