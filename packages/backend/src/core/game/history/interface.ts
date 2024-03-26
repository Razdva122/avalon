import type { IVote } from '@/core/game/history/vote';
import type { IMissionAction } from '@/core/game/history/mission';
import type { IPlayerInGame, Game } from '@/core/game';
import type {
  TAssassinateResult,
  TMissionResult,
  IMissionSettings,
  TVoteOption,
  THistoryVote,
  IHistoryMission,
  IHistoryAssassinate,
  ISwitchResult,
  ISwitchLancelots,
  TLoyalty,
  ICheckLoyalty,
  TAssassinateType,
  TTeamMember,
} from '@avalon/types';

export type THistoryData = {
  vote: {
    index: number;
    result?: TVoteOption;
    forced: boolean;
    leader: IPlayerInGame;
    team: TTeamMember[];
    votes: IVote[];
  };
  mission: {
    index: number;
    result?: TMissionResult;
    settings: IMissionSettings;
    leader?: IPlayerInGame;
    actions: IMissionAction[];
    fails?: number;
  };
  assassinate: {
    result?: TAssassinateResult;
    assassin: IPlayerInGame;
    assassinateType: TAssassinateType;
    killed?: IPlayerInGame[];
  };
  checkLoyalty: {
    validator: IPlayerInGame;
    inspected: IPlayerInGame;
    result: TLoyalty;
    realLoyalty: TLoyalty;
  };
  switchResult: {
    switcher: IPlayerInGame;
    target?: IPlayerInGame;
    result?: TMissionResult;
  };
  switchLancelots: {
    lancelotsIDs: {
      evil: string;
      good: string;
    };
    result: boolean;
  };
  hidden: Record<string, never>;
};

export type THistoryDataForManager = {
  vote: THistoryVote;
  mission: IHistoryMission;
  assassinate: IHistoryAssassinate;
  checkLoyalty: ICheckLoyalty;
  switchResult: ISwitchResult;
  switchLancelots: ISwitchLancelots;
};

export type TDataForManagerOptions = {
  game: Game;
  userID?: string;
};
