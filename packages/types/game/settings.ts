import type { IMissionSettings } from './mission';
import type { TGoodRoles, TEvilRoles, TLoyalty } from './roles';

export interface IGameSettings {
  missions: IMissionSettings[];
  players: {
    [key in TLoyalty]: number;
  };
  total: number;
}

export interface IGameSettingsWithRoles extends IGameSettings {
  roles: TGameRoles;
}

export interface TGameRoles {
  evil: TEvilRoles[];
  good: TGoodRoles[];
}
