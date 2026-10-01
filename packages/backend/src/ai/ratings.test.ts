import { calculateAiRatings } from './ratings';
import { DEFAULT_MU, DEFAULT_SIGMA } from '@avalon/types/stats/trueskill-constants';
import type { PlayerGameSummary } from '@avalon/types';
const game: PlayerGameSummary = {
  uuid: 'game',
  startAt: '2026-10-01T00:00:00Z',
  players: [
    { id: 'avalon-agent-1', role: 'merlin' },
    { id: 'avalon-agent-2', role: 'servant' },
    { id: 'avalon-agent-3', role: 'morgana' },
  ],
  result: { winner: 'good' },
};
test('AI profile ratings start at 6000 and use the same team TrueSkill calculation', () => {
  const baseline = calculateAiRatings([]).get('avalon-agent-1')!;
  expect(baseline).toMatchObject({ mu: DEFAULT_MU, sigma: DEFAULT_SIGMA, gamesCount: 0, wins: 0, losses: 0 });
  const ratings = calculateAiRatings([game]);
  expect(ratings.get('avalon-agent-1')!.mu).toBeGreaterThan(DEFAULT_MU);
  expect(ratings.get('avalon-agent-3')!.mu).toBeLessThan(DEFAULT_MU);
  expect(ratings.get('avalon-agent-1')).toMatchObject({ gamesCount: 1, wins: 1, losses: 0 });
  expect(ratings.get('avalon-agent-3')).toMatchObject({ gamesCount: 1, wins: 0, losses: 1 });
  expect(ratings.has('human')).toBe(false);
});
test('archive order is restored before rating and each game is counted once', () => {
  const old = {
    ...game,
    uuid: 'older',
    startAt: String(new Date('2026-09-01T00:00:00Z')),
    result: { winner: 'evil' as const },
  };
  expect(calculateAiRatings([game, old, game])).toEqual(calculateAiRatings([old, game]));
  expect(calculateAiRatings([game, old]).get('avalon-agent-1')!.gamesCount).toBe(2);
});

test('retired bots have no rating in the new AI profile pool', () => {
  expect(calculateAiRatings([]).has('avalon-ai-1')).toBe(false);
});
