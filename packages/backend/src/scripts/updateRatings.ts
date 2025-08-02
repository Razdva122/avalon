import { roleRatingModel, roleRankingsModel, roomModel } from '../db/models';
import { TRoles, VisualGameState } from '@avalon/types';
import { goodRolesImportance } from '@avalon/types/consts';
import { RoleRating } from '@avalon/types/stats';
import { Player } from '@avalon/types/game/player';
import { eventBus } from '@/helpers';

// Constants for rating calculation
const WINRATE_WEIGHT = 0.7;
const GAMES_COUNT_WEIGHT = 0.3;
const MAX_LOG_BASE = 100; // Adjust based on expected max games count
const MAX_DECAY = 0.3; // 20% maximum decay
const MAX_DECAY_DAYS = 90; // Days after which maximum decay is applied

// Extended game state with additional properties for rating calculation
interface ExtendedGameState extends VisualGameState {
  currentPlayer?: Player;
  startAt?: Date;
}

interface PlayerStats {
  userID: string;
  role: TRoles;
  gamesCount: number;
  wins: number;
  winrate: number;
  lastPlayedAt: Date;
}

// Rating data without rank (will be assigned after sorting)
interface RatingData extends Omit<RoleRating, 'rank'> {
  rank: number;
}

/**
 * Updates ratings for all roles based on completed games
 * This function should be called daily by a scheduler
 */
export async function updateRatings(): Promise<void> {
  console.log('Starting ratings update...');

  // Get all completed games
  const games = await getAllCompletedGames();

  // Group games by role
  const gamesByRole = groupGamesByRole(games);

  // Store all calculated ratings for history
  const allRatings: RatingData[] = [];

  // For each role, calculate ratings
  for (const [role, gamesForRole] of Object.entries(gamesByRole)) {
    // Calculate player stats for this role
    const playerStats = calculatePlayerStats(gamesForRole);

    // Calculate ratings with logarithmic scale
    const ratings = playerStats.map((player) => {
      // Calculate logarithmic factor for games count
      const logFactor = Math.log(player.gamesCount + 1) / Math.log(MAX_LOG_BASE);

      // Calculate base rating
      const baseRating = player.winrate * WINRATE_WEIGHT + logFactor * GAMES_COUNT_WEIGHT * 100;

      // Apply quadratic decay if needed
      const daysSinceLastPlayed = getDaysSince(player.lastPlayedAt);

      // Quadratic decay formula: 1 - (days/30)^2 * 0.15
      const decayFactor =
        daysSinceLastPlayed > 0
          ? Math.max(0.85, 1 - Math.pow(Math.min(daysSinceLastPlayed, MAX_DECAY_DAYS) / MAX_DECAY_DAYS, 2) * MAX_DECAY)
          : 1;

      const finalRating = player.gamesCount > 10 ? Math.ceil(baseRating * decayFactor * 100) : 0;

      const ratingData: RatingData = {
        userID: player.userID,
        role: player.role,
        winrate: player.winrate,
        gamesCount: player.gamesCount,
        rating: finalRating,
        rank: 0, // Will be set after sorting
        lastPlayedAt: player.lastPlayedAt,
        updatedAt: new Date(),
      };

      return ratingData;
    });

    // Sort by rating and assign ranks
    ratings.sort((a, b) => b.rating - a.rating);
    ratings.forEach((rating, index) => {
      rating.rank = index + 1;
    });

    // Store in database
    await storeRatings(role as TRoles, ratings);

    // Add to all ratings for history
    allRatings.push(...ratings);
  }

  // Store a snapshot of all ratings for this date
  await storeRankingsSnapshot(new Date(), allRatings);

  await updateTop1Info(allRatings);

  console.log('Ratings update completed');
}

/**
 * Emits playerReachTop1, for every player who got top-1
 */
async function updateTop1Info(ratings: RatingData[]): Promise<void> {
  // Filter for users with rank 1 and rating > 0
  const topRankings = ratings.filter((rating) => rating.rank === 1 && rating.rating > 0);

  topRankings.forEach((ranking) => {
    eventBus.emit('playerReachTop1', ranking.userID);
  });
}

/**
 * Calculates the number of days since a given date
 */
function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retrieves all completed games from the database
 */
async function getAllCompletedGames(): Promise<ExtendedGameState[]> {
  // Query the database for all completed games
  const rooms = await roomModel
    .find({
      'game.result': { $exists: true },
      'game.result.reason': { $ne: 'manualy' },
    })
    .lean();

  return rooms.map((room) => ({
    ...room.game,
    startAt: room.startAt ? new Date(room.startAt) : new Date(), // Convert string to Date
  }));
}

/**
 * Groups games by role
 */
function groupGamesByRole(games: ExtendedGameState[]): Record<string, ExtendedGameState[]> {
  const roleGames: Record<string, ExtendedGameState[]> = {};

  games.forEach((game) => {
    game.players.forEach((player) => {
      const role = player.role as TRoles;
      if (!roleGames[role]) {
        roleGames[role] = [];
      }

      // Add this game to the list for this role
      roleGames[role].push({
        ...game,
        currentPlayer: player, // Add the current player to the game for easier processing
      });
    });
  });

  return roleGames;
}

/**
 * Calculates player statistics for a set of games
 */
function calculatePlayerStats(games: ExtendedGameState[]): PlayerStats[] {
  const playerStats: Record<string, PlayerStats> = {};

  games.forEach((game) => {
    const player = game.currentPlayer;

    // Skip if player is undefined
    if (!player) {
      return;
    }

    const role = player.role as TRoles;
    const team = isGoodRole(role) ? 'good' : 'evil';
    const isWin = game.result?.winner === team;
    const gameDate = game.startAt || new Date();

    if (!playerStats[player.id]) {
      playerStats[player.id] = {
        userID: player.id,
        role,
        gamesCount: 0,
        wins: 0,
        winrate: 0,
        lastPlayedAt: gameDate,
      };
    }

    playerStats[player.id].gamesCount++;
    if (isWin) {
      playerStats[player.id].wins++;
    }

    // Update last played date if this game is more recent
    if (gameDate > playerStats[player.id].lastPlayedAt) {
      playerStats[player.id].lastPlayedAt = gameDate;
    }
  });

  // Calculate winrates
  Object.values(playerStats).forEach((stats) => {
    stats.winrate = (stats.wins / stats.gamesCount) * 100;
  });

  return Object.values(playerStats);
}

/**
 * Stores ratings for a specific role in the database
 */
async function storeRatings(role: TRoles, ratings: RatingData[]): Promise<void> {
  // Delete existing ratings for this role
  await roleRatingModel.deleteMany({ role });

  // Insert new ratings
  if (ratings.length > 0) {
    await roleRatingModel.insertMany(ratings);
  }
}

/**
 * Stores a snapshot of all ratings for historical tracking
 */
async function storeRankingsSnapshot(date: Date, ratings: RatingData[]): Promise<void> {
  await roleRankingsModel.create({
    date,
    ratings,
  });
}

/**
 * Checks if a role is on the good team
 */
function isGoodRole(role: TRoles): boolean {
  return Object.keys(goodRolesImportance).includes(role);
}
