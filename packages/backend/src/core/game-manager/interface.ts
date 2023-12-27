import type { IPlayer, TVisibleRole, IVisualGameState, Dictionary } from '@avalon/types';

export type TRoomState = Pick<IVisualGameState, 'stage' | 'history' | 'settings' | 'vote'> & {
  players: Pick<IPlayer, 'features' | 'id' | 'name'>[];
  roles: Dictionary<TVisibleRole[]>;
  publicRoles: TVisibleRole[];
};
