import type { TLoyalty, TOptionalRoles } from '@avalon/types';
import type { IGameAddon, MerlinAddon } from '@/game/addons';
import type { Character } from '@/roles';
import type { User } from '@/user';

import type { IMissionSettings, IPlayerFeatures } from '@avalon/types';

export type TGameStage = 'initialization' | 'votingForTeam' | 'onMission' | 'selectTeam' | 'selectMerlin' | 'end';

export interface IPresetsForGame {
  [key: number]: IGameSettings;
}

export interface IGameSettings {
  missions: IMissionSettings[];
  players: {
    [key in TLoyalty]: number;
  };
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
