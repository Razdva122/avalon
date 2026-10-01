import type { PlayerGameSummary, PlayerTrueSkillRating } from '@avalon/types';
import { DEFAULT_MU, DEFAULT_SIGMA, calculateConservativeRating } from '@avalon/types/stats/trueskill-constants';
import { trueSkillCalculator } from '@/scripts/trueSkillCalculator';
import { BOT_PROFILES } from './agents';

/** Rebuild the isolated AI profile rating pool; never writes human rating models. */
export function calculateAiRatings(games: PlayerGameSummary[]): Map<string, PlayerTrueSkillRating> {
  const ratings = new Map<string, PlayerTrueSkillRating>();
  const profiles = BOT_PROFILES;
  for (const profile of profiles)
    ratings.set(profile.id, {
      userID: profile.id,
      mu: DEFAULT_MU,
      sigma: DEFAULT_SIGMA,
      gamesCount: 0,
      wins: 0,
      losses: 0,
      ratingSequence: 0,
      conservativeRating: calculateConservativeRating(DEFAULT_MU, DEFAULT_SIGMA),
      lastPlayedAt: new Date(0),
      updatedAt: new Date(0),
    });
  const chronological = [...games].sort((a, b) => {
    const time = (game: PlayerGameSummary) => Date.parse(game.startAt || '') || 0;
    return time(a) - time(b) || a.uuid.localeCompare(b.uuid);
  });
  const seen = new Set<string>();
  for (const game of chronological) {
    if (
      seen.has(game.uuid) ||
      !game.result?.winner ||
      !game.players.length ||
      game.players.some((p) => !ratings.has(p.id))
    )
      continue;
    seen.add(game.uuid);
    const playedAt = new Date(Date.parse(game.startAt || '') || 0);
    const changes = trueSkillCalculator.calculateTrueSkillChangesForGame(game, ratings);
    for (const change of changes) {
      const previous = ratings.get(change.userID)!;
      ratings.set(change.userID, {
        ...previous,
        mu: change.newMu,
        sigma: change.newSigma,
        conservativeRating: change.newRating,
        gamesCount: previous.gamesCount + 1,
        wins: previous.wins + Number(change.won),
        losses: previous.losses + Number(!change.won),
        ratingSequence: previous.ratingSequence + 1,
        lastPlayedAt: playedAt,
        updatedAt: playedAt,
      });
    }
  }
  return ratings;
}
