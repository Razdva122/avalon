import { claimContext, validateClaims } from './claims';
import type { BotRequest, BotReply } from './client';

const request = (role = 'merlin', stage = 'selectTeam') =>
  ({
    playerID: 'a',
    speak: true,
    state: {
      stage,
      players: [
        { id: 'a', index: 1, role },
        { id: 'b', index: 2, role: 'unknown' },
        { id: 'c', index: 3, role: 'unknown' },
      ],
    },
    chat: [{ name: '2', text: 'Моя роль — Персиваль, Морганой считаю третьего.' }],
  }) as unknown as BotRequest;

const recordedClaim = { by: 2, target: 3, status: 'claim' as const };

test('server does not interpret role claims or trust positions from text', () => {
  for (const text of [
    'Я Персиваль. 3 — Моргана.',
    'Моя роль — Персиваль, Морганой считаю третьего.',
    "I trust 2's Percival claim.",
  ]) {
    const r = { ...request(), chat: [{ name: '2', text }] };
    expect(claimContext(r)).toMatchObject({ claims: [], previousStances: [], stanceTargets: [2, 3] });
  }
});

test('model can express its understanding of a free-form human claim without server recognition', () => {
  const reply = { choice: 0, speech: '', claimStances: [{ seat: 2, stance: 'trust' }] } as BotReply;
  expect(validateClaims(request(), reply)).toBeUndefined();
  // Not expressing a stance is also a model interpretation, not a text-parser failure.
  expect(validateClaims(request(), { choice: 0, speech: '' })).toBeUndefined();
});

test('known bot claims and previous positions come from structured actions, not their wording', () => {
  const r = {
    ...request(),
    publicRoleClaims: [recordedClaim],
    previousClaimStances: [{ seat: 2, stance: 'distrust' as const }],
    chat: [],
  };
  expect(claimContext(r)).toMatchObject({
    claims: [recordedClaim],
    previousStances: [{ seat: 2, stance: 'distrust' }],
    claimants: [2],
  });
  expect(() => validateClaims(r, { choice: 0, speech: '' })).not.toThrow();
  expect(
    validateClaims(r, {
      choice: 0,
      speech: '',
      claimMorgana: 3,
      claimStances: [
        { seat: 2, stance: 'distrust' },
        { seat: 3, stance: 'trust' },
      ],
    }),
  ).toBeUndefined();
});

test('server validates eligible roles, live seats, duplicate positions and silent turns only', () => {
  expect(claimContext(request('servant')).targets).toEqual([]);
  expect(claimContext(request('servant'))).toMatchObject({ stanceTargets: [2, 3] });
  expect(() => validateClaims(request('servant'), { choice: 0, speech: '', claimMorgana: 3 })).toThrow();
  for (const seat of [1, 4])
    expect(() =>
      validateClaims(request(), { choice: 0, speech: '', claimStances: [{ seat, stance: 'trust' }] }),
    ).toThrow();
  expect(() =>
    validateClaims(request(), {
      choice: 0,
      speech: '',
      claimStances: [
        { seat: 2, stance: 'trust' },
        { seat: 2, stance: 'distrust' },
      ],
    }),
  ).toThrow();
  for (const r of [
    { ...request(), speak: false },
    { ...request(), councilDiscussion: true },
    request('mordred', 'onMission'),
  ]) {
    expect(claimContext(r)).toMatchObject({ stanceTargets: [] });
    expect(validateClaims(r, { choice: 0, speech: '' })).toBeUndefined();
    expect(() => validateClaims(r, { choice: 0, speech: '', claimStances: [{ seat: 2, stance: 'trust' }] })).toThrow();
  }
});
