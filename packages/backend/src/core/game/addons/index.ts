export * from '@/core/game/addons/interface';
export * from '@/core/game/addons/merlin';
export * from '@/core/game/addons/lady-of-lake';
export * from '@/core/game/addons/excalibur';

import { MerlinAddon } from '@/core/game/addons/merlin';
import { LadyOfLakeAddon } from '@/core/game/addons/lady-of-lake';
import { ExcaliburAddon } from '@/core/game/addons/excalibur';

export type TAdditionalAddonsConstructor = typeof LadyOfLakeAddon | typeof ExcaliburAddon;
export type TRolesAddonsConstructor = typeof MerlinAddon;

export type TRolesAddonsKeys = 'merlin';

export type TAdditionalAddonsKeys = 'ladyOfLake' | 'excalibur';

export type TRolesAddonsData = {
  key: TRolesAddonsKeys;
  addon: TRolesAddonsConstructor;
};

export type TAdditionalAddonsData = {
  key: TAdditionalAddonsKeys;
  addon: TAdditionalAddonsConstructor;
};
