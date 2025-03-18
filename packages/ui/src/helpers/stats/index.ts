import { TRoles, VisualGameState, goodRolesImportance } from '@avalon/types';
import { TUserStats, TWinsStats, TWinsStatsWithWinrate, TGameView } from '@/helpers/stats/interface';

export * from '@/helpers/stats/interface';

export const prettifyPercent = (percent: number) => percent.toFixed(2);

export function prepareUserStats(games: VisualGameState[], userID: string): TUserStats {
  const stats = games.reduce<TUserStats<TWinsStats>>(
    (acc, game) => {
      const playerInGame = game.players.find((player) => player.id === userID)!;
      const role = <TRoles>playerInGame.role;
      const team = role in goodRolesImportance ? 'good' : 'evil';
      const isWin = game.result!.winner === team;

      if (!acc.roles[team][role]) {
        acc.roles[team][role] = { total: 0, wins: 0, lose: 0 };
      }

      acc.teams[team].total += 1;
      acc.teams.total.total += 1;
      acc.roles[team][role].total += 1;

      if (isWin) {
        acc.teams[team].wins += 1;
        acc.teams.total.wins += 1;
        acc.roles[team][role].wins += 1;
      } else {
        acc.teams[team].lose += 1;
        acc.teams.total.lose += 1;
        acc.roles[team][role].lose += 1;
      }

      return acc;
    },
    {
      teams: {
        total: { total: 0, wins: 0, lose: 0 },
        evil: { total: 0, wins: 0, lose: 0 },
        good: { total: 0, wins: 0, lose: 0 },
      },
      roles: {
        evil: {},
        good: {},
      },
    },
  );

  [
    ...Object.values(stats.roles.evil),
    ...Object.values(stats.roles.good),
    stats.teams.evil,
    stats.teams.good,
    stats.teams.total,
  ].forEach((el) => {
    const updatedEl = <TWinsStatsWithWinrate>el;
    updatedEl.winrate = prettifyPercent((el.wins / el.total) * 100);
  });

  return <TUserStats>stats;
}

export function prepareGamesForView(games: VisualGameState[], userID: string, amount: number = 5): TGameView[] {
  return games
    .reverse()
    .slice(0, amount)
    .map((game) => {
      const playerInGame = game.players.find((player) => player.id === userID)!;
      const role = <TRoles>playerInGame.role;
      const team = role in goodRolesImportance ? 'good' : 'evil';
      const isWin = game.result!.winner === team;

      return {
        role,
        isWin,
        gameID: game.uuid,
      };
    });
}
