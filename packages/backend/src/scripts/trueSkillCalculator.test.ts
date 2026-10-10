import type { PlayerGameSummary } from '@avalon/types';
import { DEFAULT_MU, DEFAULT_SIGMA } from '@avalon/types/stats/trueskill-constants';
import { trueSkillCalculator } from './trueSkillCalculator';

const players: PlayerGameSummary['players'] = [
  { id: 'player', role: 'merlin' },
  { id: 'ally-1', role: 'servant' },
  { id: 'ally-2', role: 'servant' },
  { id: 'opponent-1', role: 'morgana' },
  { id: 'opponent-2', role: 'minion' },
];

function changeFor(mu: number, winner: 'good' | 'evil', allyMu = mu, opponentMu = mu) {
  const ratings = new Map(
    players.map((player) => [
      player.id,
      {
        mu: player.id === 'player' ? mu : player.id.startsWith('ally') ? allyMu : opponentMu,
        sigma: 500,
        gamesCount: 20,
      },
    ]),
  );
  const game: PlayerGameSummary = { uuid: 'centering-game', players, result: { winner } };
  return trueSkillCalculator
    .calculateTrueSkillChangesForGame(game, ratings)
    .find((change) => change.userID === 'player')!;
}

test.each(['good', 'evil'] as const)('the fixed center leaves an equally matched %s result unadjusted', (winner) => {
  const uniform = changeFor(DEFAULT_MU, winner);
  // Both sides average 4000; changing the allies must not add a centering penalty to the player at 6000.
  const mixed = changeFor(DEFAULT_MU, winner, 3000, 4000);
  expect(mixed.muChange).toBeCloseTo(uniform.muChange, 8);
  expect(mixed.newSigma).toBeCloseTo(uniform.newSigma, 8);
});

test.each(['good', 'evil'] as const)(
  'centering uses the player rating rather than ally ratings after a %s result',
  (winner) => {
    const uniform = changeFor(8000, winner);
    // Both matches have equal team averages and uncertainty, so their underlying TrueSkill changes are equal.
    const mixed = changeFor(8000, winner, 5000, 6000);
    expect(mixed.muChange).toBeCloseTo(uniform.muChange, 8);
  },
);

test.each([
  [4000, 17 / 15, 13 / 15],
  [8000, 13 / 15, 17 / 15],
])('rating %i softly returns toward 6000 on both outcomes', (mu, winFactor, lossFactor) => {
  const baselineWin = changeFor(DEFAULT_MU, 'good');
  const baselineLoss = changeFor(DEFAULT_MU, 'evil');
  const win = changeFor(mu, 'good');
  const loss = changeFor(mu, 'evil');
  expect(win.muChange).toBeCloseTo(baselineWin.muChange * winFactor, 8);
  expect(loss.muChange).toBeCloseTo(baselineLoss.muChange * lossFactor, 8);
  expect(win.newSigma).toBeCloseTo(baselineWin.newSigma, 8);
  expect(loss.newSigma).toBeCloseTo(baselineLoss.newSigma, 8);
});

test.each([
  [0, 1.4, 0.6],
  [18000, 0.6, 1.4],
])('rating %i keeps finite, bounded changes with the correct signs', (mu, winFactor, lossFactor) => {
  const win = changeFor(mu, 'good');
  const loss = changeFor(mu, 'evil');
  expect(Number.isFinite(win.newMu)).toBe(true);
  expect(Number.isFinite(loss.newMu)).toBe(true);
  expect(win.muChange).toBeGreaterThan(0);
  expect(loss.muChange).toBeLessThan(0);
  expect(win.muChange).toBeCloseTo(changeFor(DEFAULT_MU, 'good').muChange * winFactor, 8);
  expect(loss.muChange).toBeCloseTo(changeFor(DEFAULT_MU, 'evil').muChange * lossFactor, 8);
});

test('a stronger opponent still increases the win reward and reduces the loss penalty', () => {
  const weakOpponentWin = changeFor(DEFAULT_MU, 'good', DEFAULT_MU, 4000);
  const strongOpponentWin = changeFor(DEFAULT_MU, 'good', DEFAULT_MU, 8000);
  const weakOpponentLoss = changeFor(DEFAULT_MU, 'evil', DEFAULT_MU, 4000);
  const strongOpponentLoss = changeFor(DEFAULT_MU, 'evil', DEFAULT_MU, 8000);
  expect(strongOpponentWin.muChange).toBeGreaterThan(weakOpponentWin.muChange);
  expect(Math.abs(strongOpponentLoss.muChange)).toBeLessThan(Math.abs(weakOpponentLoss.muChange));
});

test.each([
  [4, 3],
  [5, 3],
])('%i good versus %i evil preserves balanced updates for equally rated players', (goodCount, evilCount) => {
  const roster: PlayerGameSummary['players'] = [
    ...Array.from({ length: goodCount }, (_, index) => ({ id: `good-${index}`, role: 'servant' as const })),
    ...Array.from({ length: evilCount }, (_, index) => ({ id: `evil-${index}`, role: 'minion' as const })),
  ];
  const ratings = new Map(roster.map((player) => [player.id, { mu: DEFAULT_MU, sigma: DEFAULT_SIGMA, gamesCount: 0 }]));

  for (const winner of ['good', 'evil'] as const) {
    const changes = trueSkillCalculator.calculateTrueSkillChangesForGame(
      { uuid: 'unequal-teams-game', players: roster, result: { winner } },
      ratings,
    );
    expect(changes.map((change) => change.userID)).toEqual(roster.map((player) => player.id));
    const winnerGain = changes.find((change) => change.won)!.muChange;
    expect(winnerGain).toBeGreaterThan(0);
    for (const change of changes) {
      expect(change.muChange).toBeCloseTo(change.won ? winnerGain : -winnerGain, 8);
      expect(change.newSigma).toBeCloseTo(changes[0].newSigma, 8);
      expect(Number.isFinite(change.newMu)).toBe(true);
    }
  }
});
