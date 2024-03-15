import { TOptionalRoles } from './roles';

export interface IGameOptions {
  roles: TGameOptionsRoles;
  addons: TGameOptionsAddons;
  features: TGameOptionsFeatures;
}

export type TGameOptionsRoles = {
  [key in TOptionalRoles]?: number;
};

export type TGameOptionsAddons = {
  ladyOfLake?: boolean;
  excalibur?: boolean;
};

export type TGameOptionsFeatures = {
  anonymousVoting?: boolean;
  hiddenHistory?: boolean;
};
