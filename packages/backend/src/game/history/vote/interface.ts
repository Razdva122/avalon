import type { IPlayerInGame } from '@/game';
import type { TVoteOption } from '@avalon/types';

export interface IVote {
  player: IPlayerInGame;
  onMission: boolean;
  value: TVoteOption | 'unvoted';
}
