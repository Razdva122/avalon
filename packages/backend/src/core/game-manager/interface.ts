import type { IPlayer, TVisibleRole, IVisualGameState, Dictionary, TVoteOption } from '@avalon/types';

export type TRoomState = Pick<IVisualGameState, 'stage' | 'history' | 'settings' | 'vote'> & {
  players: Pick<IPlayer, 'features' | 'id' | 'name'>[];
  roles: Dictionary<TVisibleRole[]>;
  publicRoles: TVisibleRole[];
};

export type TGameMethodsParams = TSelectPlayerParams | TVoteParams | TSentPlayersParams;

export type TSelectPlayerParams = {
  method: 'selectPlayer';
  playerID: string;
};

export type TVoteParams = {
  method: 'voteForMission';
  option: TVoteOption;
};

export type TSentPlayersParams = {
  method: 'sentSelectedPlayers';
};
