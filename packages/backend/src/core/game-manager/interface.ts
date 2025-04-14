import type {
  Player,
  VisualGameState,
  TVoteOption,
  TMissionResult,
  TLoyalty,
  THistoryResults,
  TAssassinateType,
  TRoles,
} from '@avalon/types';

import type { TDataForManagerOptions } from '@/core/game/history';

export type TRoomState = Omit<VisualGameState, 'players' | 'history'> & {
  players: Pick<Player, 'features' | 'id' | 'index'>[];
  history: ((options: TDataForManagerOptions) => THistoryResults)[];
};

export type TGameMethodsParams =
  | TSelectPlayerParams
  | TVoteParams
  | TSentPlayersParams
  | TActionOnMissionParams
  | TAssassinateParams
  | TCheckLoyaltyParams
  | TRevealLoyaltyParams
  | TAnnounceLoyaltyParams
  | TGiveExcaliburParams
  | TUseExcaliburParams
  | TWitchAbilityParams
  | TGivePlotCardParams
  | TPreVoteParams
  | TUseLeadToVictoryParams
  | TUseAmbushParams
  | TUseRestoreHonorParams
  | TUseKingReturnsParams
  | TUseWeFoundYouParams;

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
  cardID?: string;
};

export type TRevealLoyaltyParams = {
  method: 'revealLoyalty';
  cardID?: string;
};

export type TAnnounceLoyaltyParams = {
  method: 'announceLoyalty';
  loyalty: TLoyalty | TRoles;
  cardID?: string;
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
  cardID: string;
};

export type TUseLeadToVictoryParams = {
  method: 'useLeadToVictory';
  use: boolean;
  cardID: string;
};

export type TUseAmbushParams = {
  method: 'useAmbush';
  cardID: string;
};

export type TUseRestoreHonorParams = {
  method: 'useRestoreHonor';
  restoreHonorCardID: string;
  cardID: string;
};

export type TUseKingReturnsParams = {
  method: 'useKingReturns';
  use: boolean;
  cardID: string;
};

export type TUseWeFoundYouParams = {
  method: 'useWeFoundYou';
  use: boolean;
  cardID: string;
};

export type TGetLoyaltyData = {
  params: {
    method: 'getLoyalty';
    cardID?: string;
  };
  result: TLoyalty | TRoles;
};
