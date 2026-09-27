import { roomModel } from '../db/models';
import { publishRoleRatings, beginRoleRatingPublication, cleanupRoleRatingGenerations } from './roleRatingStorage';
import { TRoles } from '@avalon/types';
import { goodRolesImportance } from '@avalon/types/consts';
import { RoleRating } from '@avalon/types/stats';
import { eventBus } from '@/helpers';

// Constants for rating calculation
const WINRATE_WEIGHT = 0.7;
const GAMES_COUNT_WEIGHT = 0.3;
const MAX_LOG_BASE = 100; // Adjust based on expected max games count
const MAX_DECAY = 0.3; // 20% maximum decay
const MAX_DECAY_DAYS = 90; // Days after which maximum decay is applied

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
  await cleanupRoleRatingGenerations();
  const staging = await beginRoleRatingPublication();
  const statsByRole = await collectPlayerStats();

  // Store all calculated ratings for history
  const allRatings: RatingData[] = [];

  // For each role, calculate ratings
  for (const playerStats of Object.values(statsByRole)) {
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

    // Add to all ratings for history
    allRatings.push(...ratings);
  }

  // Store a snapshot of all ratings for this date
  await publishRoleRatings(allRatings, new Date(), staging);

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
async function collectPlayerStats(): Promise<Record<string, PlayerStats[]>> {
  const stats = new Map<string, Map<string, PlayerStats>>();
  const cursor = roomModel
    .find(
      { 'game.result': { $exists: true }, 'game.result.reason': { $ne: 'manualy' } },
      { roomID: 1, startAt: 1, 'game.players.id': 1, 'game.players.role': 1, 'game.result.winner': 1 },
    )
    .sort({ roomID: 1 })
    .lean()
    .cursor({ batchSize: 250 });
  let previousRoom: string | undefined;
  try {
    for await (const room of cursor) {
      if (room.roomID === previousRoom) continue;
      previousRoom = room.roomID;
      for (const player of room.game.players) {
        const role = player.role as TRoles;
        const byPlayer = stats.get(role) || new Map<string, PlayerStats>();
        stats.set(role, byPlayer);
        const date = new Date(room.startAt);
        const value = byPlayer.get(player.id) || {
          userID: player.id,
          role,
          gamesCount: 0,
          wins: 0,
          winrate: 0,
          lastPlayedAt: date,
        };
        value.gamesCount++;
        if (room.game.result?.winner === (isGoodRole(role) ? 'good' : 'evil')) value.wins++;
        if (date > value.lastPlayedAt) value.lastPlayedAt = date;
        value.winrate = (value.wins / value.gamesCount) * 100;
        byPlayer.set(player.id, value);
      }
    }
  } finally {
    await cursor.close();
  }
  return Object.fromEntries([...stats].map(([role, players]) => [role, [...players.values()]]));
}

/**
 * Checks if a role is on the good team
 */
function isGoodRole(role: TRoles): boolean {
  return Object.keys(goodRolesImportance).includes(role);
}
