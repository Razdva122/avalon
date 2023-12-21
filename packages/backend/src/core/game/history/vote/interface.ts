import type { IPlayerInGame } from '@/core/game';
import type { TVoteOption } from '@avalon/types';

export interface IVote {
  player: IPlayerInGame;
  onMission: boolean;
  value: TVoteOption | 'unvoted';
}
