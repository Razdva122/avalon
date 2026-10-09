import { decisionPipeline } from './pipeline';
import { compactRequest } from './client';
import type { BotRequest } from './client';

const request = {
  playerID: 'bot',
  humanPlayerID: 'human',
  name: '1',
  style: 'brief',
  speak: true,
  task: 'Discuss a preferred team',
  publicDiscussion: true,
  choices: ['1, 2'],
  state: {
    stage: 'selectTeam',
    mission: 0,
    vote: 0,
    history: [],
    players: [
      { id: 'bot', index: 1, role: 'merlin', features: {} },
      { id: 'human', index: 2, role: 'unknown', features: {} },
      { id: 'other', index: 3, role: 'unknown', features: {} },
    ],
  },
  chat: [{ name: '2', text: 'Скажу иначе: моя роль — Персиваль; из двух кандидатов третий оказался Морганой.' }],
} as unknown as BotRequest;

test('publishes a model-understood human claim and remembers its position after chatter and on silent votes', async () => {
  const contexts: Record<string, unknown>[] = [];
  const decide = decisionPipeline(async (_r, options) => {
    if (options.phase === 'speech') return { choice: 0, speech: 'Голоса третьего поддерживают эту версию.' };
    contexts.push(options.context as Record<string, unknown>);
    return {
      choice: 0,
      speech: 'The human claim fits the votes.',
      publicReason: 'Голоса третьего поддерживают эту версию.',
      claimStances: _r.speak ? [{ seat: 2, stance: 'trust' }] : [],
    };
  });
  const first = await decide({ ...request, language: 'ru' });
  expect(first.speech).toBe('Голоса третьего поддерживают эту версию.');
  // Decisions get testimony, not a parser-derived human role assignment.
  expect(contexts[0]).toMatchObject({
    publicRoleClaims: [],
    claimStanceTargets: [2, 3],
    humanStatements: [{ by: 2, text: request.chat[0].text, status: 'claim' }],
  });
  const later = {
    ...request,
    speak: false,
    publicDiscussion: false,
    choices: ['approve', 'reject'],
    state: { ...request.state, stage: 'votingForTeam' },
    chat: [...request.chat, ...Array.from({ length: 20 }, () => ({ name: '3', text: 'Consider a different team.' }))],
  } as BotRequest;
  expect((await decide(later)).speech).toBe('');
  expect(contexts[1]).toMatchObject({
    previousClaimStances: [{ seat: 2, stance: 'trust' }],
    claimStanceTargets: [],
    humanStatements: [{ text: request.chat[0].text }],
  });
});

test('published structured bot claims survive without parsing their chat and remain available without forcing a response on every turn', async () => {
  const contexts: Record<string, unknown>[] = [];
  let declared = false;
  const decide = decisionPipeline(async (r, options) => {
    if (options.phase === 'speech') return { choice: 0, speech: 'This fits the record.' };
    contexts.push(options.context as Record<string, unknown>);
    if (!declared) {
      declared = true;
      return {
        choice: 0,
        speech: 'Claim for cover.',
        publicReason: 'I am Percival; I have reason to call 3 Morgana.',
        claimMorgana: 3,
      };
    }
    return {
      choice: 0,
      speech: 'Assess the declaration.',
      publicReason: 'This fits the record.',
      claimStances: [{ seat: 1, stance: 'distrust' }],
    };
  });
  expect((await decide(request)).speech).toBe('I am Percival; I have reason to call 3 Morgana.');
  const other = {
    ...request,
    playerID: 'other',
    name: '3',
    choices: ['2, 3'],
    chat: [],
    state: {
      ...request.state,
      players: request.state.players.map((p) => ({ ...p, role: p.id === 'other' ? 'servant' : 'unknown' })),
    },
  } as BotRequest;
  expect((await decide(other)).speech).toBe('This fits the record.');
  expect(contexts[1]).toMatchObject({
    publicRoleClaims: [{ by: 1, target: 3, status: 'claim' }],
    requiredClaimStances: [],
  });
});

test('a textual retraction is left to the model, not silently converted to an active role claim', () => {
  const r = {
    ...request,
    chat: [...request.chat, { name: '2', text: 'Отзываю вскрытие, это была проверка реакции.' }],
  };
  expect(compactRequest(r)).toMatchObject({
    publicRoleClaims: [],
    humanStatements: [{ text: request.chat[0].text }, { text: 'Отзываю вскрытие, это была проверка реакции.' }],
  });
});
