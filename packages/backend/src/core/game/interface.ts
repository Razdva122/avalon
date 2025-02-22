import type {
  ExcaliburAddon,
  IGameAddon,
  LadyOfLakeAddon,
  AssassinAddon,
  LancelotsAddon,
  WitchAddon,
  ClericAddon,
  RevealerAddon,
  LadyOfSeaAddon,
} from '@/core/game/addons';
import type { Character } from '@/core/roles';
import type { User } from '@/user';

import type { TGameStage, PlayerFeatures, GameSettings } from '@avalon/types';

export interface IPresetsForGame {
  [key: number]: GameSettings;
}

export interface IPlayerInGame {
  index: number;
  user: User;
  role: Character;

  /**
   * Next player in game
   */
  next: IPlayerInGame;

  features: PlayerFeatures;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TAddonsArray = IGameAddon<any>[];

export interface IGameAddons extends TAddonsArray {
  assassin?: AssassinAddon;
  ladyOfLake?: LadyOfLakeAddon;
  ladyOfSea?: LadyOfSeaAddon;
  excalibur?: ExcaliburAddon;
  lancelots?: LancelotsAddon;
  witch?: WitchAddon;
  cleric?: ClericAddon;
  revealer?: RevealerAddon;
}

export interface IStateObserver {
  gameStateChanged(): void;
}

export type TSelectAvailable = {
  [key in TGameStage]?: (player: IPlayerInGame) => boolean;
};
