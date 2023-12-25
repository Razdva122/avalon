import type { IPlayer } from './player';
import type { THistoryResults } from './history';
import type { IGameSettings } from './settings';

export interface IVisualGameState {
  stage: TGameStage;
  settings: IGameSettings;
  history: THistoryResults[];
  players: IPlayer[];
}

/**
 * Possible game stages
 */
export type TGameStage = 'initialization' | 'votingForTeam' | 'onMission' | 'selectTeam' | 'selectMerlin' | 'end';
