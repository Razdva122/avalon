import { TRoles } from '@avalon/types';

export type TUserStats<T extends TWinsStats = TWinsStatsWithWinrate> = {
  teams: {
    total: T;
    evil: T;
    good: T;
  };
  roles: {
    evil: {
      [key in TRoles]?: T;
    };
    good: {
      [key in TRoles]?: T;
    };
  };
};

export type TGameView = {
  role: TRoles;
  isWin: boolean;
  playersCount: number;
};

export type TWinsStatsWithWinrate = {
  winrate: string;
} & TWinsStats;

export type TWinsStats = {
  total: number;
  wins: number;
  lose: number;
};
