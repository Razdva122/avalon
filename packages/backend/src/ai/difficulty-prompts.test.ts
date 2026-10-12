import { BotRoom } from './room';
import { compactRequest } from './client';
import type { BotRequest, GenerationOptions } from './client';
import { decisionPipeline, decisionInstructions, publicContext } from './pipeline';
import type { Server, VisualGameState } from '@avalon/types';

// The reported vote used [5,1,3] but its reason incorrectly described a team without 5.
const request: BotRequest = {
  playerID: '1',
  name: '1',
  style: 'Careful.',
  language: 'zh-tw',
  task: 'Vote on the selected team.',
  speak: false,
  chat: [],
  choices: ['approve', 'reject'],
  state: {
    stage: 'votingForTeam',
    mission: 4,
    vote: 0,
    history: [],
    players: [
      { id: '1', index: 1, role: 'merlin', features: { isSelected: true, isLeader: true } },
      { id: '2', index: 2, role: 'unknown', features: {} },
      { id: '3', index: 3, role: 'unknown', features: { isSelected: true } },
      { id: '4', index: 4, role: 'unknown', features: {} },
      { id: '5', index: 5, role: 'evil', features: { isSelected: true } },
    ],
    settings: {
      players: { good: 3, evil: 2 },
      roles: { good: ['merlin', 'percival', 'servant'], evil: ['mordred', 'morgana'] },
      missions: Array.from({ length: 5 }, () => ({ players: 3, failsRequired: 1 })),
    },
  } as unknown as VisualGameState,
};

test.each(['selectTeam', 'votingForTeam'] as const)(
  'regular %s gets shorter instructions and role advice without changing facts or legal actions',
  async (stage) => {
    const input = {
      ...request,
      state: { ...request.state, stage },
      choices: stage === 'selectTeam' ? ['5, 1, 3', '1, 2, 3'] : request.choices,
    };
    const regular = { ...input, botDifficulty: 'regular' as const };
    const smart = { ...input, botDifficulty: 'smart' as const };
    const contexts: GenerationOptions[] = [];
    const decide = decisionPipeline(async (_r, options) => {
      contexts.push(options);
      return { choice: 0, speech: 'Private reason.', publicReason: '' };
    });
    // Prompt advice does not become a server veto or silently change the model's choice.
    expect(await decide(regular)).toMatchObject({ choice: 0 });
    expect(await decide(smart)).toMatchObject({ choice: 0 });
    expect(contexts[0].instructions!.length).toBeLessThan(contexts[1].instructions!.length * 0.8);
    const a = compactRequest(regular),
      b = compactRequest(smart);
    expect(a.roleAdvice!.length).toBeLessThan(b.roleAdvice!.length * 0.6);
    expect(a.privateKnowledge).toEqual(b.privateKnowledge);
    expect(a.actionFacts).toEqual(b.actionFacts);
    expect(a.actionFacts).toMatchObject({ team: [1, 3, 5], knownEvilOnTeam: [5], failsRequired: 1 });
    expect(a.choices).toEqual(input.choices);
    expect(publicContext(regular, input.choices[0])).not.toHaveProperty('privateKnowledge');
  },
);

test('unspecified difficulty keeps smart instructions and non-team phases keep their shared instructions', () => {
  const smart = { ...request, botDifficulty: 'smart' as const };
  expect(decisionInstructions(request)).toBe(decisionInstructions(smart));
  const card = { ...request, state: { ...request.state, stage: 'onMission' as const }, choices: ['success', 'fail'] };
  expect(decisionInstructions({ ...card, botDifficulty: 'regular' } as BotRequest)).toBe(
    decisionInstructions({ ...card, botDifficulty: 'smart' } as BotRequest),
  );
});

test.each(['regular', 'smart'] as const)('a %s room passes its difficulty to every decision', async (difficulty) => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const requests: BotRequest[] = [];
  const room = new BotRoom(
    'difficulty-room',
    'admin',
    io,
    async (r) => {
      requests.push(r);
      return { choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0, speech: '' };
    },
    undefined,
    0,
    'en',
    5,
  );
  room.ai!.botDifficulty = difficulty;
  await room.run();
  expect(room.ai?.status).toBe('finished');
  expect(requests.length).toBeGreaterThan(0);
  for (const r of requests) expect(r).toMatchObject({ botDifficulty: difficulty });
});
