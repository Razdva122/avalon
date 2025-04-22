import { VisualGameState, TVisibleRole, TGoodRoles } from '@avalon/types';
import { PlayerTrueSkillChange } from '@avalon/types/stats/trueskill';
import { goodRolesImportance } from '@avalon/types/consts';
import { TrueSkill, Rating } from 'ts-trueskill';
import {
  DEFAULT_MU,
  DEFAULT_SIGMA,
  BETA,
  TAU,
  DRAW_PROBABILITY,
  calculateConservativeRating,
} from '@avalon/types/stats/trueskill-constants';

/**
 * Helper function to check if a role is on the good team
 */
function isGoodRole(role: TVisibleRole): boolean {
  return role === 'good' || Object.keys(goodRolesImportance).includes(role as TGoodRoles);
}

/**
 * Calculator for TrueSkill rating changes
 */
export class TrueSkillCalculator {
  // TrueSkill instance
  private readonly trueskill: TrueSkill;

  constructor() {
    // Configure TrueSkill parameters using constants
    this.trueskill = new TrueSkill(
      DEFAULT_MU, // mu
      DEFAULT_SIGMA, // sigma
      BETA, // beta
      TAU, // tau
      DRAW_PROBABILITY, // drawProbability
    );
  }

  /**
   * Calculate conservative rating (mu - 3*sigma)
   * This gives a 99.7% confidence that the player's true skill is at least this value
   */
  calculateConservativeRating(mu: number, sigma: number): number {
    return calculateConservativeRating(mu, sigma);
  }

  /**
   * Calculate TrueSkill changes for all players in a game
   */
  calculateTrueSkillChangesForGame(
    game: VisualGameState,
    currentRatings: Map<string, { mu: number; sigma: number; gamesCount: number }>,
  ): PlayerTrueSkillChange[] {
    if (!game.result || !game.result.winner) {
      return []; // No changes if game has no result
    }

    const goodTeam = game.players.filter((p) => isGoodRole(p.role));
    const evilTeam = game.players.filter((p) => !isGoodRole(p.role));

    // Create TrueSkill rating objects for each player
    const goodTeamRatingsWithPlayers = goodTeam.map((player) => {
      const ratingData = currentRatings.get(player.id) || {
        mu: DEFAULT_MU,
        sigma: DEFAULT_SIGMA,
        gamesCount: 0,
      };
      return {
        player,
        rating: new Rating(ratingData.mu, ratingData.sigma),
      };
    });

    const evilTeamRatingsWithPlayers = evilTeam.map((player) => {
      const ratingData = currentRatings.get(player.id) || {
        mu: DEFAULT_MU,
        sigma: DEFAULT_SIGMA,
        gamesCount: 0,
      };
      return {
        player,
        rating: new Rating(ratingData.mu, ratingData.sigma),
      };
    });

    // Determine ranks (1 = winner, 2 = loser)
    const goodTeamRank = game.result.winner === 'good' ? 1 : 2;
    const evilTeamRank = game.result.winner === 'evil' ? 1 : 2;

    // Create teams for TrueSkill calculation
    const goodTeamRatings = goodTeamRatingsWithPlayers.map((item) => item.rating);
    const evilTeamRatings = evilTeamRatingsWithPlayers.map((item) => item.rating);

    // Normalize teams to have the same effective size for fair rating calculation
    const normalizedGoodTeam = this.normalizeTeam(goodTeamRatings);
    const normalizedEvilTeam = this.normalizeTeam(evilTeamRatings);

    // Calculate new ratings using normalized teams
    const [normalizedNewGoodRatings, normalizedNewEvilRatings] = this.trueskill.rate(
      [normalizedGoodTeam, normalizedEvilTeam],
      [goodTeamRank, evilTeamRank],
    );

    // Map normalized ratings back to original team sizes
    const isGoodTeamWinner = game.result!.winner === 'good';
    const newGoodRatings = this.mapNormalizedRatingsToOriginal(
      normalizedNewGoodRatings,
      goodTeamRatings,
      isGoodTeamWinner,
    );
    const newEvilRatings = this.mapNormalizedRatingsToOriginal(
      normalizedNewEvilRatings,
      evilTeamRatings,
      !isGoodTeamWinner,
    );

    // Calculate average ratings for both teams for comparison
    const avgGoodTeamRating = goodTeamRatings.reduce((sum, r) => sum + r.mu, 0) / goodTeamRatings.length;
    const avgEvilTeamRating = evilTeamRatings.reduce((sum, r) => sum + r.mu, 0) / evilTeamRatings.length;
    const ratingDifference = Math.abs(avgGoodTeamRating - avgEvilTeamRating);

    const changes: PlayerTrueSkillChange[] = [];

    // Process team changes using a generic function
    this.processTeamChanges(
      changes,
      goodTeamRatingsWithPlayers,
      newGoodRatings,
      avgGoodTeamRating,
      ratingDifference,
      'good',
      game.result!.winner === 'good',
    );

    this.processTeamChanges(
      changes,
      evilTeamRatingsWithPlayers,
      newEvilRatings,
      avgEvilTeamRating,
      ratingDifference,
      'evil',
      game.result!.winner === 'evil',
    );

    return changes;
  }

  /**
   * Normalizes a team to a standard size for fair rating calculation
   * This ensures that teams of different sizes are treated equally
   * @param teamRatings Original team ratings
   * @returns Normalized team ratings with standard size
   */
  private normalizeTeam(teamRatings: Rating[]): Rating[] {
    // Fixed size for normalized teams
    const normalizedSize = 5;

    if (teamRatings.length === normalizedSize) {
      // If team already has the target size, return a copy of the original ratings
      return teamRatings.map((r) => new Rating(r.mu, r.sigma));
    } else if (teamRatings.length < normalizedSize) {
      // If team is smaller than target size, add virtual players with team average skill
      const totalMu = teamRatings.reduce((sum, rating) => sum + rating.mu, 0);
      const totalSigma = teamRatings.reduce((sum, rating) => sum + rating.sigma, 0);
      const avgMu = totalMu / teamRatings.length;
      const avgSigma = totalSigma / teamRatings.length;

      // Create a normalized team by keeping original players and adding virtual players
      const normalizedTeam = [...teamRatings.map((r) => new Rating(r.mu, r.sigma))];

      // Add virtual players with average rating to reach the target size
      const virtualPlayersCount = normalizedSize - teamRatings.length;
      for (let i = 0; i < virtualPlayersCount; i++) {
        normalizedTeam.push(new Rating(avgMu, avgSigma));
      }

      return normalizedTeam;
    } else {
      // If team is larger than target size, create a representative subset
      // Sort ratings by mu (skill level)
      const sortedRatings = [...teamRatings].sort((a, b) => b.mu - a.mu);

      // Calculate step size to select representative players across the skill range
      const step = teamRatings.length / normalizedSize;

      // Select representative players
      const normalizedTeam: Rating[] = [];
      for (let i = 0; i < normalizedSize; i++) {
        const index = Math.min(Math.floor(i * step), teamRatings.length - 1);
        normalizedTeam.push(new Rating(sortedRatings[index].mu, sortedRatings[index].sigma));
      }

      return normalizedTeam;
    }
  }

  /**
   * Maps normalized ratings back to the original team size
   * @param normalizedRatings Ratings from the normalized team calculation
   * @param originalRatings Original team ratings
   * @param isWinningTeam Whether this team won the game
   * @returns Mapped ratings matching the original team size
   */
  private mapNormalizedRatingsToOriginal(
    normalizedRatings: Rating[],
    originalRatings: Rating[],
    isWinningTeam: boolean,
  ): Rating[] {
    // Calculate the average change in mu and sigma from the normalized calculation
    const oldAvgMu = originalRatings.reduce((sum, r) => sum + r.mu, 0) / originalRatings.length;
    const oldAvgSigma = originalRatings.reduce((sum, r) => sum + r.sigma, 0) / originalRatings.length;

    const newAvgMu = normalizedRatings.reduce((sum, r) => sum + r.mu, 0) / normalizedRatings.length;
    const newAvgSigma = normalizedRatings.reduce((sum, r) => sum + r.sigma, 0) / normalizedRatings.length;

    // Calculate total change for the team
    const totalMuChange = newAvgMu - oldAvgMu;
    const totalSigmaChange = newAvgSigma - oldAvgSigma;

    // Calculate team average mu and sigma
    const avgTeamMu = originalRatings.reduce((sum, r) => sum + r.mu, 0) / originalRatings.length;
    const avgTeamSigma = originalRatings.reduce((sum, r) => sum + r.sigma, 0) / originalRatings.length;

    // Create a copy of original ratings to modify
    const newRatings = originalRatings.map((r) => new Rating(r.mu, r.sigma));

    // Calculate relative skill and sigma factors for each player compared to team average
    const playersWithFactors = originalRatings.map((rating, index) => {
      // Calculate how much better/worse the player is compared to team average
      const relativeSkill = (rating.mu - avgTeamMu) / (avgTeamMu || 1);

      // Calculate sigma factor - how much more/less uncertain this player's rating is
      const relativeSigma = (rating.sigma - avgTeamSigma) / (avgTeamSigma || 1);

      return { rating, index, relativeSkill, relativeSigma };
    });

    // Apply weighted changes based on relative skill
    // For winners: Higher skilled players get smaller gains, lower skilled players get larger gains
    // For losers: Higher skilled players get larger penalties, lower skilled players get smaller penalties
    playersWithFactors.forEach((item) => {
      // Calculate weight factor based on relative skill and whether team won or lost
      let skillWeightFactor = 1.0;

      if (isWinningTeam) {
        // WINNING TEAM: Higher skilled players get smaller gains, lower skilled players get larger gains
        if (item.relativeSkill > 0) {
          // Player is better than team average - reduce factor (smaller gains)
          skillWeightFactor = 1.0 - item.relativeSkill * 0.5;
        } else {
          // Player is worse than team average - increase factor (larger gains)
          skillWeightFactor = 1.0 + Math.abs(item.relativeSkill) * 0.5;
        }
      } else {
        // LOSING TEAM: Higher skilled players get larger penalties, lower skilled players get smaller penalties
        if (item.relativeSkill > 0) {
          // Player is better than team average - increase factor (larger penalties)
          skillWeightFactor = 1.0 + item.relativeSkill * 0.5;
        } else {
          // Player is worse than team average - reduce factor (smaller penalties)
          skillWeightFactor = 1.0 - Math.abs(item.relativeSkill) * 0.5;
        }
      }

      // Calculate sigma weight factor - higher sigma means faster adaptation
      // Players with higher sigma (more uncertainty) should have larger rating changes
      const sigmaWeightFactor = 1.0 + item.relativeSigma * 0.5;

      // Combine skill and sigma factors
      let weightFactor = skillWeightFactor * sigmaWeightFactor;

      // Ensure factor stays within reasonable bounds
      weightFactor = Math.max(0.5, Math.min(2.0, weightFactor));

      // Apply weighted change to the player's rating
      const individualMuChange = totalMuChange * weightFactor;
      const individualSigmaChange = totalSigmaChange * weightFactor;

      // Update the rating at the original index
      newRatings[item.index] = new Rating(
        originalRatings[item.index].mu + individualMuChange,
        Math.max(0.1, originalRatings[item.index].sigma + individualSigmaChange), // Ensure sigma doesn't go too low
      );
    });

    return newRatings;
  }

  /**
   * Process rating changes for a team
   * @param changes Array to collect player changes
   * @param teamRatingsWithPlayers Team players with their ratings
   * @param newRatings New ratings calculated by TrueSkill
   * @param avgTeamRating Average rating of the team
   * @param ratingDifference Difference between teams' average ratings
   * @param teamType Team type ('good' or 'evil')
   * @param isWinningTeam Whether this team won the game
   */
  private processTeamChanges(
    changes: PlayerTrueSkillChange[],
    teamRatingsWithPlayers: { player: { id: string; role: TVisibleRole }; rating: Rating }[],
    newRatings: Rating[],
    avgTeamRating: number,
    ratingDifference: number,
    teamType: 'good' | 'evil',
    isWinningTeam: boolean,
  ): void {
    teamRatingsWithPlayers.forEach((item, index) => {
      const oldRating = item.rating;
      const player = item.player;
      const newRating = newRatings[index];
      const oldConservativeRating = this.calculateConservativeRating(oldRating.mu, oldRating.sigma);

      // Calculate base change
      let muChange = newRating.mu - oldRating.mu;

      // Calculate team average sigma
      const avgTeamSigma =
        teamRatingsWithPlayers.reduce((sum, item) => sum + item.rating.sigma, 0) / teamRatingsWithPlayers.length;

      // Apply skill and sigma-based adjustment
      const adjustmentFactor = this.calculateSkillAdjustmentFactor(
        oldRating.mu,
        avgTeamRating,
        ratingDifference,
        isWinningTeam,
        oldRating.sigma,
        avgTeamSigma,
      );
      muChange *= adjustmentFactor;

      // Calculate adjusted new ratings
      const adjustedNewMu = oldRating.mu + muChange;
      const adjustedNewSigma = newRating.sigma; // Keep sigma as calculated by TrueSkill
      const adjustedNewConservativeRating = this.calculateConservativeRating(adjustedNewMu, adjustedNewSigma);

      changes.push({
        userID: player.id,
        oldMu: oldRating.mu,
        oldSigma: oldRating.sigma,
        newMu: adjustedNewMu,
        newSigma: adjustedNewSigma,
        oldRating: oldConservativeRating,
        newRating: adjustedNewConservativeRating,
        change: adjustedNewConservativeRating - oldConservativeRating,
        muChange: muChange,
        role: player.role as TGoodRoles,
        team: teamType,
        won: isWinningTeam,
      });
    });
  }

  /**
   * Calculates a skill adjustment factor based on player's rating compared to team average
   * Higher rated players get smaller adjustment factors (for winners) or larger penalties (for losers)
   * @param playerMu Player's mu rating
   * @param teamAvgMu Team's average mu rating
   * @param teamsDifference Difference between teams' average ratings
   * @param isWinner Whether the player's team won the game
   * @returns Adjustment factor between 0.4 and 1.6
   */
  private calculateSkillAdjustmentFactor(
    playerMu: number,
    teamAvgMu: number,
    teamsDifference: number,
    isWinner: boolean = true,
    playerSigma: number = 0,
    teamAvgSigma: number = 0,
  ): number {
    // Calculate how much better/worse the player is compared to team average
    const relativeSkill = (playerMu - teamAvgMu) / (teamAvgMu || 1);

    // Calculate how much more/less uncertain this player's rating is
    const relativeSigma = teamAvgSigma > 0 ? (playerSigma - teamAvgSigma) / teamAvgSigma : 0;

    // Normalize the teams difference to have more impact when teams are balanced
    const normalizedTeamsDiff = Math.min(teamsDifference / 1000, 1);

    // Calculate base factor based on relative skill and whether player won or lost
    let skillFactor = 1.0;

    if (isWinner) {
      // WINNER: Higher skilled players get smaller gains, lower skilled players get larger gains
      if (relativeSkill > 0) {
        // Player is better than team average - reduce factor (smaller gains)
        skillFactor = 1.0 - relativeSkill;
      } else {
        // Player is worse than team average - increase factor (larger gains)
        skillFactor = 1.0 + Math.abs(relativeSkill);
      }
    } else {
      // LOSER: Higher skilled players get larger penalties, lower skilled players get smaller penalties
      if (relativeSkill > 0) {
        // Player is better than team average - increase factor (larger penalties)
        skillFactor = 1.0 + relativeSkill;
      } else {
        // Player is worse than team average - reduce factor (smaller penalties)
        skillFactor = 1.0 - Math.abs(relativeSkill);
      }
    }

    // Calculate sigma factor - higher sigma means faster adaptation
    // Players with higher sigma (more uncertainty) should have larger rating changes
    const sigmaFactor = 1.0 + relativeSigma * 0.5;

    // Apply team difference adjustment - when teams are balanced, individual skill matters more
    skillFactor = skillFactor * (1 - normalizedTeamsDiff * 0.2);

    // Combine skill and sigma factors
    const combinedFactor = skillFactor * sigmaFactor;

    // Ensure factor stays within reasonable bounds (0.4 to 2.0) - wider range for more differentiation
    const finalFactor = Math.max(0.4, Math.min(2.0, combinedFactor));

    return finalFactor;
  }
}

// Export singleton instance
export const trueSkillCalculator = new TrueSkillCalculator();
