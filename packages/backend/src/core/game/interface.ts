import type { ExcaliburAddon, IGameAddon, LadyOfLakeAddon, MerlinAddon } from '@/core/game/addons';
import type { Character } from '@/core/roles';
import type { User } from '@/user';

import type { TGameStage, IPlayerFeatures, IGameSettings } from '@avalon/types';

export interface IPresetsForGame {
  [key: number]: IGameSettings;
}

export interface IPlayerInGame {
  user: User;
  role: Character;

  /**
   * Next player in game
   */
  next: IPlayerInGame;

  features: IPlayerFeatures;
}

export type TAddonsArray = IGameAddon[];

export interface IGameAddons extends TAddonsArray {
  merlin?: MerlinAddon;
  ladyOfLake?: LadyOfLakeAddon;
  excalibur?: ExcaliburAddon;
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
