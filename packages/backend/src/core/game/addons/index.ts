export * from '@/core/game/addons/interface';
export * from '@/core/game/addons/assassin';
export * from '@/core/game/addons/lady-of-lake';
export * from '@/core/game/addons/lady-of-sea';
export * from '@/core/game/addons/excalibur';
export * from '@/core/game/addons/lancelots';
export * from '@/core/game/addons/witch';
export * from '@/core/game/addons/cleric';
export * from '@/core/game/addons/revealer';
export * from '@/core/game/addons/plot-cards';

import type { TAddonsOptions } from '@/core/game/addons/interface';

import { AssassinAddon } from '@/core/game/addons/assassin';
import { LadyOfLakeAddon } from '@/core/game/addons/lady-of-lake';
import { ExcaliburAddon } from '@/core/game/addons/excalibur';
import { LancelotsAddon } from '@/core/game/addons/lancelots';
import { WitchAddon } from '@/core/game/addons/witch';
import { ClericAddon } from '@/core/game/addons/cleric';
import { RevealerAddon } from '@/core/game/addons/revealer';
import { LadyOfSeaAddon } from '@/core/game/addons/lady-of-sea';
import { PlotCardsAddon } from '@/core/game/addons/plot-cards';

import type { TAddonsName } from '@avalon/types';

export type TAdditionalAddonsConstructor =
  | typeof LadyOfLakeAddon
  | typeof ExcaliburAddon
  | typeof LadyOfSeaAddon
  | typeof PlotCardsAddon;

export type TRolesAddonsConstructor =
  | typeof AssassinAddon
  | typeof LancelotsAddon
  | typeof WitchAddon
  | typeof ClericAddon
  | typeof RevealerAddon;

export type TRolesAddonsKeys = 'assassin' | 'lancelots' | 'witch' | 'cleric' | 'revealer';

export type TRolesAddonsData = {
  key: TRolesAddonsKeys;
  addon: TRolesAddonsConstructor;
  options?: TAddonsOptions;
};

export type TAdditionalAddonsData = {
  key: TAddonsName;
  addon: TAdditionalAddonsConstructor;
};
