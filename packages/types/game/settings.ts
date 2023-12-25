import type { IMissionSettings } from './mission';
import type { TLoyalty } from './roles';

export interface IGameSettings {
  missions: IMissionSettings[];
  players: {
    [key in TLoyalty]: number;
  };
  total: number;
}
