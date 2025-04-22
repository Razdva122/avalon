/**
 * TrueSkill Rating System Constants
 *
 * These constants define the behavior of the TrueSkill rating system.
 * Changing these values will affect how ratings are calculated and displayed.
 */

// Base skill value for new players
export const DEFAULT_MU = 6000.0;

// Initial uncertainty in player skill
// Increased from 1000.0 to 1500.0 to allow for faster initial adaptation
// This helps new players reach their true skill level within 10-20 games
export const DEFAULT_SIGMA = 1500.0;

// Skill distance that guarantees 76% win probability
// Reduced from 2000 to 1200 to make skill differences more meaningful
// This creates more noticeable rating differences between players of different skill levels
export const BETA = 1200;

// Dynamic factor, smaller values = slower adaptation
// Increased from 25 to 35 to allow for more dynamic rating changes (30-50 points per game)
// This makes the system more responsive to recent performance
export const TAU = 35;

// No draws in Avalon
export const DRAW_PROBABILITY = 0.0;

// Conservative rating calculation factor (typically 3 for 99.7% confidence)
export const CONSERVATIVE_RATING_FACTOR = 3;

// Minimum number of games required for leaderboard inclusion
export const MIN_GAMES_FOR_LEADERBOARD = 10;

// Calculate conservative rating (mu - 3*sigma)
export function calculateConservativeRating(mu: number, sigma: number): number {
  return Math.max(0, mu - CONSERVATIVE_RATING_FACTOR * sigma);
}
