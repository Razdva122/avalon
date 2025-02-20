import type { MissionSettings } from './mission';
import type { TGoodRoles, TEvilRoles, TLoyalty } from './roles';

export interface IGameSettings {
  missions: MissionSettings[];
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
