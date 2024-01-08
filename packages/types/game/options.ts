import { TOptionalRoles } from './roles';

export interface IGameOptions {
  roles: {
    [key in TOptionalRoles]?: number;
  };
  addons: {
    ladyOfLake?: boolean;
  };
}
