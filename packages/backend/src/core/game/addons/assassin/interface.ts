import type { IPlayerInGame } from '@/core/game';
import type { TAssassinateType, TRoles } from '@avalon/types';

export type TAssassinateValidator = Array<(player: IPlayerInGame) => boolean>;
export type TCustomAssassinateCreator = { type: 'custom'; creator: (role: TRoles) => boolean };

export type TAssassinateOptions = {
  [key in TAssassinateType]?: Array<TAssassinateValidator | TCustomAssassinateCreator>;
};
