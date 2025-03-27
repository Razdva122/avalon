import type {
  Player,
  VisualGameState,
  TVoteOption,
  TMissionResult,
  TLoyalty,
  THistoryResults,
  TAssassinateType,
  TRoles,
  TLoyaltyType,
} from '@avalon/types';

import type { TDataForManagerOptions } from '@/core/game/history';

export type TRoomState = Omit<VisualGameState, 'players' | 'history'> & {
  players: Pick<Player, 'features' | 'id' | 'name' | 'index'>[];
  history: ((options: TDataForManagerOptions) => THistoryResults)[];
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
  | TWitchAbilityParams
  | TGivePlotCardParams
  | TPreVoteParams
  | TUseLeadToVictoryParams;

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
  customRole?: TRoles;
};

export type TCheckLoyaltyParams = {
  method: 'checkLoyalty';
};

export type TAnnounceLoyaltyParams = {
  method: 'announceLoyalty';
  loyalty: TLoyalty | TRoles;
  type: TLoyaltyType;
};

export type TGiveExcaliburParams = {
  method: 'giveExcalibur';
};

export type TUseExcaliburParams = {
  method: 'useExcalibur';
};

export type TGivePlotCardParams = {
  method: 'givePlotCard';
};

export type TPreVoteParams = {
  method: 'preVote';
  option: TVoteOption;
};

export type TUseLeadToVictoryParams = {
  method: 'useLeadToVictory';
  use: boolean;
};

export type TGetLoyaltyData = {
  params: {
    method: 'getLoyalty';
    type: TLoyaltyType;
  };
  result: TLoyalty | TRoles;
};
