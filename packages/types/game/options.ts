import { TOptionalRoles } from './roles';

export interface IGameOptions {
  roles: TGameOptionsRoles;
  addons: TGameOptionsAddons;
}

export type TGameOptionsRoles = {
  [key in TOptionalRoles]?: number;
};

export type TGameOptionsAddons = {
  ladyOfLake?: boolean;
  excalibur?: boolean;
};
