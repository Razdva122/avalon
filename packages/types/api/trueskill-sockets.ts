import { PlayerTrueSkillRating, GameTrueSkillResult } from '../stats/trueskill';

/**
 * TrueSkill leaderboard entry
 */
export interface TrueSkillLeaderboardEntry {
  rank: number;
  userID: string;
  mu: number;
  sigma: number;
  conservativeRating: number;
  gamesCount: number;
  wins: number;
  losses: number;
}

/**
 * TrueSkill socket events
 */
export interface TrueSkillSocketEvents {
  // Get TrueSkill rating for a player
  getTrueSkillRating: (
    userID: string,
    callback: (result: { success: boolean; rating?: PlayerTrueSkillRating; error?: string }) => void,
  ) => void;

  // Get TrueSkill leaderboard
  getTrueSkillLeaderboard: (
    callback: (result: { success: boolean; leaderboard?: TrueSkillLeaderboardEntry[]; error?: string }) => void,
  ) => void;

  // Get TrueSkill changes for a specific match
  getMatchTrueSkillChanges: (
    gameID: string,
    callback: (result: { success: boolean; gameResult?: GameTrueSkillResult; error?: string }) => void,
  ) => void;
}
