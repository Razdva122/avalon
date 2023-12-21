export * from '@/core/game/addons/interface';
export * from '@/core/game/addons/merlin';

import { MerlinAddon } from '@/core/game/addons/merlin';

export type TAddonsConstructor = typeof MerlinAddon;
