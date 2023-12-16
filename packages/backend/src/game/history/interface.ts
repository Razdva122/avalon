import type { IVote } from '@/game/history/vote';
import type { IMissionAction } from '@/game/history/mission';
import type { IPlayerInGame } from '@/game';
import type { TAssassinateResult, TMissionResult, IMissionSettings, TVoteOption } from '@avalon/types';

export type THistoryData = {
  vote: {
    result?: TVoteOption;
    leader: IPlayerInGame;
    votes: IVote[];
  };
  mission: {
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
