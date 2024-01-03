import type { IVote } from '@/core/game/history/vote';
import type { IMissionAction } from '@/core/game/history/mission';
import type { IPlayerInGame } from '@/core/game';
import type {
  TAssassinateResult,
  TMissionResult,
  IMissionSettings,
  TVoteOption,
  THistoryVote,
  THistoryMission,
  THistoryAssassinate,
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
};

export type THistoryDataForManager = {
  vote: THistoryVote;
  mission: THistoryMission;
  assassinate: THistoryAssassinate;
};
