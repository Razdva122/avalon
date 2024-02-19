import type { IPlayerInGame } from '@/core/game';
import type { TAssassinateType } from '@avalon/types';

export type TAssassinateValidator = Array<(player: IPlayerInGame) => boolean>;

export type TAssassinateOptions = {
  [key in TAssassinateType]?: TAssassinateValidator;
};
