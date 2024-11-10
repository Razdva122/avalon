import type {
  IPlayer,
  TVisibleRole,
  IVisualGameState,
  Dictionary,
  TVoteOption,
  TMissionResult,
  TLoyalty,
  THistoryResults,
  TAssassinateType,
} from '@avalon/types';

import type { TDataForManagerOptions } from '@/core/game/history';

export type TRoomState = Omit<IVisualGameState, 'players' | 'history'> & {
  players: Pick<IPlayer, 'features' | 'id' | 'name' | 'index'>[];
  history: ((options: TDataForManagerOptions) => THistoryResults)[];
  roles: Dictionary<TVisibleRole[]>;
  publicRoles: TVisibleRole[];
};

export type TGameMethodsParams =
  | TSelectPlayerParams
  | TVoteParams
  | TSentPlayersParams
  | TActionOnMissionParams
  | TAssassinateParams
  | TCheckLoyaltyParams
  | TAnnounceLoyaltyParams
  | TGiveExcaliburParams
  | TUseExcaliburParams
  | TWitchAbilityParams;

export type TSelectPlayerParams = {
  method: 'selectPlayer';
  playerID: string;
};

export type TVoteParams = {
  method: 'voteForMission';
  option: TVoteOption;
};

export type TWitchAbilityParams = {
  method: 'witchAbility';
  result: boolean;
};

export type TSentPlayersParams = {
  method: 'sentSelectedPlayers';
};

export type TActionOnMissionParams = {
  method: 'actionOnMission';
  result: TMissionResult;
};

export type TAssassinateParams = {
  method: 'assassinate';
  type: TAssassinateType;
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
