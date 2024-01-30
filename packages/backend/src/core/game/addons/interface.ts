import { Game } from '@/core/game';
import type { TGameStage } from '@avalon/types';

export type TBeforeMethods = `before${Capitalize<TGameStage>}`;
export type TAfterMethods = `after${Capitalize<TGameStage>}`;

export type TAddonMethodResult = { continueExecution: boolean; updateStage: boolean };

export type TBefore = Partial<Record<TBeforeMethods, (prev: TGameStage) => TAddonMethodResult>>;
export type TAfter = Partial<Record<TAfterMethods, (next: TGameStage) => TAddonMethodResult>>;

export type TRolesWithAddons = 'merlin' | 'merlinPure';

export type TAdditionalAddons = 'ladyOfLake' | 'excalibur';

export interface IGameAddon extends TBefore, TAfter {
  game: Game;
}
