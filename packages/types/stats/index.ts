import { TOptionalRoles } from '@avalon/types';

export type TTotalWinrateStats = {
  total: TWinrateStats;
  byPlayers: (TWinrateStats & { playerCount: number })[];
  roleStats: TRoleStats[];
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
  gamesCount: number;
  goodWins: number;
  evilWins: number;
  goodWinPercentage: number;
  evilWinPercentage: number;
};
