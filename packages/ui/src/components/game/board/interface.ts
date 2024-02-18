import type { IMissionSettings, TMissionResult, IPlayer, IPlayerFeatures, TVoteOption } from '@avalon/types';
import type { TPlayerIcon } from '@/components/game/information/interface';

export interface IMissionWithResult extends IMissionSettings {
  result?: TMissionResult;
  fails?: number;
}

export interface IFrontendPlayer extends Omit<IPlayerWithVote, 'role'> {
  role: TPlayerIcon;
}

export interface IPlayerWithVote extends IPlayer {
  features: IPlayerFeatures & { vote?: TVoteOption } & { switch?: 'toFail' | 'toSuccess' };
}
