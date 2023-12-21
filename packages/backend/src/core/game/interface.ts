import type { TGameStage, TLoyalty, TOptionalRoles } from '@avalon/types';
import type { IGameAddon, MerlinAddon } from '@/core/game/addons';
import type { Character } from '@/core/roles';
import type { User } from '@/user';

import type { IMissionSettings, IPlayerFeatures } from '@avalon/types';

export interface IPresetsForGame {
  [key: number]: IGameSettings;
}

export interface IGameSettings {
  missions: IMissionSettings[];
  players: {
    [key in TLoyalty]: number;
  };
  total: number;
}

export interface IGameOptions {
  roles: {
    [key in TOptionalRoles]?: number;
  };
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
}

export interface IStateObserver {
  gameStateChanged(): void;
}

export type TStageVisibilityChange = {
  [key in TGameStage]?: (stage: TGameStage, role: Character) => boolean;
};
