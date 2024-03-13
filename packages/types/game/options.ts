import { TOptionalRoles } from './roles';

export interface IGameOptions {
  roles: TGameOptionsRoles;
  addons: TGameOptionsAddons;
  features: TGameFeatures;
}

export type TGameOptionsRoles = {
  [key in TOptionalRoles]?: number;
};

export type TGameOptionsAddons = {
  ladyOfLake?: boolean;
  excalibur?: boolean;
};

export type TGameFeatures = {
  anonymousVoting?: boolean;
};
