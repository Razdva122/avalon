import { TOptionalRoles } from './roles';

import { prop } from '@typegoose/typegoose';

export interface IGameOptions {
  roles: TGameOptionsRoles;
  addons: TGameOptionsAddons;
  features: GameOptionsFeatures;
}

export type TGameOptionsRoles = {
  [key in TOptionalRoles]?: number;
};

export type TGameOptionsAddons = {
  ladyOfLake?: boolean;
  ladyOfSea?: boolean;
  excalibur?: boolean;
};

export class GameOptionsFeatures {
  @prop()
  public anonymousVoting?: boolean;

  @prop()
  public hiddenHistory?: boolean;

  @prop()
  public displayIndex?: boolean;
}
