import { TAddonsName, TOptionalRoles } from '@avalon/types';

export type TTotalWinrateStats = {
  total: TWinrateStats;
  byPlayers: (TWinrateStats & { playerCount: number })[];
  roleStats: TRoleStats[];
  addonsStats: TAddonStats[];
};

export type TWinrateStats = {
  gamesCount: number;
  goodWins: number;
  evilWins: number;
  goodWinPercentage: number;
  evilWinPercentage: number;
};

export type TRoleStats = {
  role: TOptionalRoles;
} & TWinrateStats;

export type TAddonStats = {
  addon: TAddonsName;
} & TWinrateStats;
