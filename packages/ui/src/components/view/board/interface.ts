import type { Player, PlayerFeatures, TVoteOption } from '@avalon/types';
import type { TPlayerIcon } from '@/components/view/information/interface';

export interface IFrontendPlayer extends Omit<IPlayerWithVote, 'role'> {
  role: TPlayerIcon;
}

export interface IPlayerWithVote extends Player {
  features: PlayerFeatures & { vote?: TVoteOption | 'forced-approve' } & { switch?: 'toFail' | 'toSuccess' };
}
