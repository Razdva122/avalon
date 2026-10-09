import { compactRequest } from './client';
import type { BotRequest } from './client';
import { focusedRetry, publicContext } from './pipeline';

const human = { name: '2', text: 'Я персиваль 5 это моргана. 4 поддерживает походы с 5, не берите их.' };
const request = {
  playerID: 'bot',
  humanPlayerID: 'human',
  name: '1',
  style: 'brief',
  speak: true,
  task: 'Discuss the team',
  publicDiscussion: true,
  choices: ['1, 2'],
  state: {
    stage: 'selectTeam',
    mission: 0,
    vote: 0,
    history: [],
    players: Array.from({ length: 7 }, (_, i) => ({
      id: i === 0 ? 'bot' : i === 1 ? 'human' : `seat-${i + 1}`,
      index: i + 1,
      role: i === 0 ? 'servant' : 'unknown',
      features: {},
    })),
  },
  chat: [human, ...Array.from({ length: 30 }, () => ({ name: '3', text: 'Предпочитаю 3, 4.' }))],
} as unknown as BotRequest;

test('human warnings and free-form role testimony survive bot chatter and retries without text classification', () => {
  const expected = {
    humanStatements: [{ by: 2, text: human.text, status: 'claim' }],
    publicRoleClaims: [],
  };
  const context = compactRequest(request);
  expect(context).toMatchObject(expected);
  expect(context.chat).toHaveLength(14);
  expect(context.chat).not.toContainEqual({ by: '2', text: human.text });
  expect(publicContext(request, '1, 2')).toMatchObject(expected);
  const retry = focusedRetry({ context, decisionDetails: true, phase: 'decision', maxOutput: 1000 });
  expect(retry.context).toMatchObject(expected);
  expect(JSON.stringify(publicContext(request, '1, 2'))).not.toMatch(
    /humanPlayerID|privateKnowledge|servant|"bot"|"human"/,
  );
});

test('retains early human evidence and recent revisions with bounded text', () => {
  const current = {
    ...request,
    chat: Array.from({ length: 40 }, (_, i) => ({ name: '2', text: `${i}: ${'x'.repeat(1000)}` })),
  };
  const context = compactRequest(current);
  expect(context).toMatchObject({ humanStatements: expect.any(Array) });
  const statements = (context as unknown as { humanStatements: { text: string }[] }).humanStatements;
  expect(statements).toHaveLength(24);
  expect(statements[0].text).toMatch(/^0:/);
  expect(statements[statements.length - 1].text).toMatch(/^39:/);
  expect(statements.every((s) => s.text.length <= 600)).toBe(true);
});

test('all-bot games and secret mission turns do not add human testimony', () => {
  const allBots = { ...request, humanPlayerID: undefined } as BotRequest;
  expect(compactRequest(allBots)).toMatchObject({ humanStatements: [] });
  expect(compactRequest({ ...request, state: { ...request.state, stage: 'onMission' } })).not.toHaveProperty(
    'humanStatements',
    expect.any(Array),
  );
});
