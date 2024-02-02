import type { IVote } from '@/core/game/history/vote';
import type { IMissionAction } from '@/core/game/history/mission';
import type { IPlayerInGame, Game } from '@/core/game';
import type {
  TAssassinateResult,
  TMissionResult,
  IMissionSettings,
  TVoteOption,
  IHistoryVote,
  IHistoryMission,
  IHistoryAssassinate,
  ISwitchResult,
  TLoyalty,
  ICheckLoyalty,
} from '@avalon/types';

export type THistoryData = {
  vote: {
    index: number;
    result?: TVoteOption;
    forced: boolean;
    leader: IPlayerInGame;
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
    killed?: IPlayerInGame;
  };
  checkLoyalty: {
    validator: IPlayerInGame;
    inspected: IPlayerInGame;
    result: TLoyalty;
  };
  switchResult: {
    switcher: IPlayerInGame;
    target?: IPlayerInGame;
    result?: TMissionResult;
  };
};

export type THistoryDataForManager = {
  vote: IHistoryVote;
  mission: IHistoryMission;
  assassinate: IHistoryAssassinate;
  checkLoyalty: ICheckLoyalty;
  switchResult: ISwitchResult;
};

export type TDataForManagerOptions = {
  game: Game;
  userID?: string;
};
