import type {
  IPlayer,
  TVisibleRole,
  IVisualGameState,
  Dictionary,
  TVoteOption,
  TMissionResult,
  TLoyalty,
  THistoryResults,
} from '@avalon/types';

import type { TDataForManagerOptions } from '@/core/game/history';

export type TRoomState = Omit<IVisualGameState, 'players' | 'history'> & {
  players: Pick<IPlayer, 'features' | 'id' | 'name'>[];
  history: ((options: TDataForManagerOptions) => THistoryResults)[];
  roles: Dictionary<TVisibleRole[]>;
  publicRoles: TVisibleRole[];
};

export type TGameMethodsParams =
  | TSelectPlayerParams
  | TVoteParams
  | TSentPlayersParams
  | TActionOnMissionParams
  | TSelectMerlinParams
  | TCheckLoyaltyParams
  | TAnnounceLoyaltyParams
  | TGiveExcaliburParams
  | TUseExcaliburParams;

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

export type TActionOnMissionParams = {
  method: 'actionOnMission';
  result: TMissionResult;
};

export type TSelectMerlinParams = {
  method: 'selectMerlin';
};

export type TCheckLoyaltyParams = {
  method: 'checkLoyalty';
};

export type TAnnounceLoyaltyParams = {
  method: 'announceLoyalty';
  loyalty: TLoyalty;
};

export type TGiveExcaliburParams = {
  method: 'giveExcalibur';
};

export type TUseExcaliburParams = {
  method: 'useExcalibur';
};

export type TGetLoyaltyData = {
  params: {
    method: 'getLoyalty';
  };
  result: TLoyalty;
};
