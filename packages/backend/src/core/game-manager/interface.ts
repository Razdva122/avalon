import type { THistoryResults, IPlayer, TGameStage, TVisibleRole, Dictionary } from '@avalon/types';
import type { IGameSettings } from '@/core/game';

export interface IVisualGameState {
  stage: TGameStage;
  settings: IGameSettings;
  history: THistoryResults[];
  players: IPlayer[];
}

export type TRoomState = Pick<IVisualGameState, 'stage' | 'history' | 'settings'> & {
  players: Pick<IPlayer, 'features' | 'id' | 'name'>[];
  roles: Dictionary<TVisibleRole[]>;
  publicRoles: TVisibleRole[];
};
