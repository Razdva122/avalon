export * from '@/core/game/addons/interface';
export * from '@/core/game/addons/merlin';
export * from '@/core/game/addons/lady-of-lake';

import { MerlinAddon } from '@/core/game/addons/merlin';
import { LadyOfLakeAddon } from '@/core/game/addons/lady-of-lake';

export type TAdditionalAddonsConstructor = typeof LadyOfLakeAddon;
export type TRolesAddonsConstructor = typeof MerlinAddon;
