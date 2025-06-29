import type { IPlayerInGame } from '@/core/game';
import type { TAssassinateType, TRoles } from '@avalon/types';
import type { Character } from '@/core/roles';

export type TAssassinateValidator = Array<(player: IPlayerInGame) => boolean>;
export type TCustomAssassinateCreator = { type: 'custom'; creator: (roles: Character[]) => TRoles[] };

export type TAssassinateOptions = {
  [key in TAssassinateType]?: Array<TAssassinateValidator | TCustomAssassinateCreator>;
};
