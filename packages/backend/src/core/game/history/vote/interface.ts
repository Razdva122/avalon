import type { IPlayerInGame } from '@/core/game';
import type { TVoteOption } from '@avalon/types';

export interface IVote {
  player: IPlayerInGame;
  onMission: boolean;
  excalibur?: boolean;
  preVote?: TVoteOption;
  value: TVoteOption | 'unvoted';
}

export interface IPreVote {
  player: IPlayerInGame;
  value: TVoteOption | 'unvoted';
}
