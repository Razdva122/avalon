import { VisualGameState, TVisibleRole, TGoodRoles, TEvilRoles } from '@avalon/types';
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

    // Extract ratings for balancing
    const goodTeamRatings = goodTeamRatingsWithPlayers.map((item) => item.rating);
    const evilTeamRatings = evilTeamRatingsWithPlayers.map((item) => item.rating);

    // Balance teams by adding fake players to evil team
    const { balancedEvilTeamRatings } = this.balanceTeams(goodTeamRatings, evilTeamRatings);

    // Determine ranks (1 = winner, 2 = loser)
    const goodTeamRank = game.result.winner === 'good' ? 1 : 2;
    const evilTeamRank = game.result.winner === 'evil' ? 1 : 2;

    // Calculate new ratings using balanced teams
    const [newGoodRatings, newEvilRatings] = this.trueskill.rate(
      [goodTeamRatings, balancedEvilTeamRatings],
      [goodTeamRank, evilTeamRank],
    );

    const changes: PlayerTrueSkillChange[] = [];

    // Process good team changes
    this.processTeamChanges(
      changes,
      goodTeamRatingsWithPlayers,
      newGoodRatings,
      'good',
      game.result!.winner === 'good',
    );

    // Process evil team changes (only real players)
    this.processTeamChanges(
      changes,
      evilTeamRatingsWithPlayers,
      newEvilRatings,
      'evil',
      game.result!.winner === 'evil',
    );

    return changes;
  }

  /**
   * Balances teams by adding fake players to the evil team to match good team size
   * @param goodTeamRatings Good team ratings
   * @param evilTeamRatings Evil team ratings
   * @returns Balanced evil team ratings and a map of real player indices
   */
  private balanceTeams(
    goodTeamRatings: Rating[],
    evilTeamRatings: Rating[],
  ): {
    balancedEvilTeamRatings: Rating[];
    realPlayerIndices: number[];
  } {
    // If teams are already balanced (shouldn't happen in Avalon), return as-is
    if (evilTeamRatings.length >= goodTeamRatings.length) {
      return {
        balancedEvilTeamRatings: evilTeamRatings,
        realPlayerIndices: evilTeamRatings.map((_, i) => i),
      };
    }

    // Calculate average rating for the evil team
    const totalMu = evilTeamRatings.reduce((sum, rating) => sum + rating.mu, 0);
    const totalSigma = evilTeamRatings.reduce((sum, rating) => sum + rating.sigma, 0);
    const avgMu = totalMu / evilTeamRatings.length;
    const avgSigma = totalSigma / evilTeamRatings.length;

    // Create fake evil players with average rating
    const numFakePlayers = goodTeamRatings.length - evilTeamRatings.length;
    const fakePlayers = Array(numFakePlayers)
      .fill(null)
      .map(() => new Rating(avgMu, avgSigma));

    // Track indices of real players
    const realPlayerIndices = evilTeamRatings.map((_, i) => i);

    // Return balanced evil team
    return {
      balancedEvilTeamRatings: [...evilTeamRatings, ...fakePlayers],
      realPlayerIndices,
    };
  }

  /**
   * Process rating changes for a team
   * @param changes Array to collect player changes
   * @param teamRatingsWithPlayers Team players with their ratings
   * @param newRatings New ratings calculated by TrueSkill
   * @param teamType Team type ('good' or 'evil')
   * @param isWinningTeam Whether this team won the game
   */
  private processTeamChanges(
    changes: PlayerTrueSkillChange[],
    teamRatingsWithPlayers: { player: { id: string; role: TVisibleRole }; rating: Rating }[],
    newRatings: Rating[],
    teamType: 'good' | 'evil',
    isWinningTeam: boolean,
  ): void {
    teamRatingsWithPlayers.forEach((item, index) => {
      const oldRating = item.rating;
      const player = item.player;
      const newRating = newRatings[index];

      // Calculate conservative ratings
      const oldConservativeRating = this.calculateConservativeRating(oldRating.mu, oldRating.sigma);
      const newConservativeRating = this.calculateConservativeRating(newRating.mu, newRating.sigma);

      changes.push({
        userID: player.id,
        oldMu: oldRating.mu,
        oldSigma: oldRating.sigma,
        newMu: newRating.mu,
        newSigma: newRating.sigma,
        oldRating: oldConservativeRating,
        newRating: newConservativeRating,
        change: newConservativeRating - oldConservativeRating,
        muChange: newRating.mu - oldRating.mu,
        role: teamType === 'good' ? (player.role as TGoodRoles) : (player.role as TEvilRoles),
        team: teamType,
        won: isWinningTeam,
      });
    });
  }
}

// Export singleton instance
export const trueSkillCalculator = new TrueSkillCalculator();
