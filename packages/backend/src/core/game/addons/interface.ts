import { Game } from '@/core/game';
import type { TGameStage } from '@avalon/types';
import type { THookNames } from '@/core/game/hooks';

export type TBeforeMethods = `before${Capitalize<TGameStage>}`;
export type TAfterMethods = `after${Capitalize<TGameStage>}`;

export type TMethods = Partial<Record<THookNames, () => boolean>>;

export type TRolesWithAddons = 'merlin' | 'merlinPure';

export type TAdditionalAddons = 'ladyOfLake' | 'excalibur';

export interface IGameAddon extends TMethods {
  game: Game;
}
