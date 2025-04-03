import { TRoles, VisualGameState, goodRolesImportance } from '@avalon/types';
import { TUserStats, TWinsStats, TWinsStatsWithWinrate, TGameView, TTeammateStats } from '@/helpers/stats/interface';

export * from '@/helpers/stats/interface';

export const prettifyPercent = (percent: number) => percent.toFixed(2);

export function prepareUserStats(games: VisualGameState[], userID: string): TUserStats {
  const stats = games.reduce<TUserStats<TWinsStats>>(
    (acc, game) => {
      const playerInGame = game.players.find((player) => player.id === userID)!;
      const role = <TRoles>playerInGame.role;
      const team = Object.keys(goodRolesImportance).includes(role) ? 'good' : 'evil';
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
      const team = Object.keys(goodRolesImportance).includes(role) ? 'good' : 'evil';
      const isWin = game.result!.winner === team;

      return {
        role,
        isWin,
        gameID: game.uuid,
      };
    });
}

/**
 * Prepares statistics for players who played with the user
 * @param games List of games
 * @param userID User ID
 * @param relation 'teammate' to get players on the same team, 'enemy' to get players on the opposite team
 * @param limit Maximum number of players to return
 * @returns Array of player statistics
 */
export function preparePlayerStats(
  games: VisualGameState[],
  userID: string,
  relation: 'teammate' | 'enemy',
  limit: number = 5,
): TTeammateStats[] {
  // Create a map to track statistics for each player
  const playersMap = new Map<
    string,
    {
      id: string;
      gamesCount: number;
      wins: number;
      lose: number;
    }
  >();

  games.forEach((game) => {
    // Find the current user in the game
    const currentPlayer = game.players.find((player) => player.id === userID);
    if (!currentPlayer) return;

    // Determine the user's team (good or evil)
    const userRole = <TRoles>currentPlayer.role;
    const userTeam = Object.keys(goodRolesImportance).includes(userRole) ? 'good' : 'evil';
    const isWin = game.result?.winner === userTeam;

    // Find players based on relation (teammates or enemies)
    const players = game.players.filter((player) => {
      if (player.id === userID) return false; // Skip the user
      const playerRole = <TRoles>player.role;
      const playerTeam = Object.keys(goodRolesImportance).includes(playerRole) ? 'good' : 'evil';

      // For teammates, return players on the same team
      // For enemies, return players on the opposite team
      return relation === 'teammate' ? playerTeam === userTeam : playerTeam !== userTeam;
    });

    // Update statistics for each player
    players.forEach((player) => {
      const playerData = playersMap.get(player.id) || {
        id: player.id,
        gamesCount: 0,
        wins: 0,
        lose: 0,
      };

      playerData.gamesCount += 1;
      if (isWin) {
        playerData.wins += 1;
      } else {
        playerData.lose += 1;
      }

      playersMap.set(player.id, playerData);
    });
  });

  // Convert map to array and calculate winrate
  const playersArray = Array.from(playersMap.values())
    .map((player) => ({
      ...player,
      winrate: prettifyPercent((player.wins / player.gamesCount) * 100),
    }))
    .sort((a, b) => b.gamesCount - a.gamesCount) // Sort by games count (descending)
    .slice(0, limit); // Limit to specified number of players

  return playersArray;
}
