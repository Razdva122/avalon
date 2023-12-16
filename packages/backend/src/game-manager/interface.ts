import type { THistoryResults, IPlayer, TGameStage } from '@avalon/types';
import type { IGameSettings } from '@/game';

export interface IVisualGameState {
  stage: TGameStage;
  settings: IGameSettings;
  history: THistoryResults;
  players: IPlayer[];
}
