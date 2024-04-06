import { Game } from '@/core/game';
import type { TAddonsData, TGameStage } from '@avalon/types';
import type { TAssassinateOptions } from '@/core/game/addons/assassin/interface';
import type { THookNames } from '@/core/game/hooks';

export type TBeforeMethods = `before${Capitalize<TGameStage>}`;
export type TAfterMethods = `after${Capitalize<TGameStage>}`;

export type TMethods = Partial<Record<THookNames, () => boolean>>;

export type TRolesWithAddons = 'merlin' | 'merlinPure' | 'tristan' | 'goodLancelot' | 'guinevere';

export type TAdditionalAddons = 'ladyOfLake' | 'excalibur';

export type TAddonsOptions = TAssassinateOptions;

export interface IGameAddon<T extends TAssassinateOptions | undefined = undefined> extends TMethods {
  addonName: string;
  game: Game;
  options?: T;
  addonData?: TAddonsData;
}
