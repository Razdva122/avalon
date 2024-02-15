import type { IPlayerInGame } from '@/core/game';
import type { TMissionResult } from '@avalon/types';

export interface IMissionAction {
  player: IPlayerInGame;
  switched?: boolean;
  value: TMissionResult | 'unvoted';
}
