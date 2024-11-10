import type {
  ExcaliburAddon,
  IGameAddon,
  LadyOfLakeAddon,
  AssassinAddon,
  LancelotsAddon,
  WitchAddon,
} from '@/core/game/addons';
import type { Character } from '@/core/roles';
import type { User } from '@/user';

import type { TGameStage, IPlayerFeatures, IGameSettings } from '@avalon/types';

export interface IPresetsForGame {
  [key: number]: IGameSettings;
}

export interface IPlayerInGame {
  index: number;
  user: User;
  role: Character;

  /**
   * Next player in game
   */
  next: IPlayerInGame;

  features: IPlayerFeatures;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TAddonsArray = IGameAddon<any>[];

export interface IGameAddons extends TAddonsArray {
  assassin?: AssassinAddon;
  ladyOfLake?: LadyOfLakeAddon;
  excalibur?: ExcaliburAddon;
  lancelots?: LancelotsAddon;
  witch?: WitchAddon;
}

export interface IStateObserver {
  gameStateChanged(): void;
}

export type TStageVisibilityChange = {
  [key in TGameStage]?: (stage: TGameStage, role: Character) => boolean;
};

export type TSelectAvailable = {
  [key in TGameStage]?: (player: IPlayerInGame) => boolean;
};
