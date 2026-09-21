import { parseReply, yandexDecide, AiPause, compactRequest } from './client';
import type { BotRequest } from './client';
import type { AiRepository } from './repository';
import type { VisualGameState } from '@avalon/types';
const request: BotRequest = {
  playerID: 'bot',
  name: 'Alice',
  style: 'brief',
  task: 'Vote',
  speak: true,
  state: {} as VisualGameState,
  chat: [],
  choices: ['approve', 'reject'],
};
const realFetch = global.fetch;
const env = { ...process.env };
afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...env };
});
function setup() {
  process.env.YANDEX_MODEL = 'qwen3.6-35b-a3b';
  process.env.YANDEX_API_KEY = 'test-secret';
  process.env.YANDEX_FOLDER_ID = 'folder';
  let charged = 0;
  const repo = {
    reserve: async (_room: string, units: number) => {
      charged += units;
    },
    settle: async (_room: string, reserved: number, actual: number) => {
      charged += actual - reserved;
    },
    roomCost: async () => charged / 10000,
  } as unknown as AiRepository;
  return { repo, cost: () => charged };
}
test('rejects invented choices and oversized speech', () => {
  expect(() => parseReply('{"choice":9,"speech":"hello"}', 2)).toThrow();
  expect(() => parseReply(JSON.stringify({ choice: 0, speech: 'a'.repeat(501) }), 2)).toThrow();
  expect(parseReply('{"choice":1,"speech":"I disagree."}', 2)).toEqual({ choice: 1, speech: 'I disagree.' });
});
test('uses bounded English JSON generation and reconciles billed tokens', async () => {
  const { repo, cost } = setup();
  global.fetch = (async (_url, options) => {
    const payload = JSON.parse(options!.body as string);
    expect(payload.response_format.type).toBe('json_schema');
    expect(payload.response_format.json_schema.schema.properties.choice.enum).toEqual([0, 1]);
    expect(payload.reasoning_effort).toBe('none');
    expect(payload.max_tokens).toBeLessThanOrEqual(384);
    expect(payload.messages[0].content).toContain('ENGLISH ONLY');
    expect(payload.messages[0].content).not.toContain('test-secret');
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10 },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"Let us test this team."}' } }],
      }),
    );
  }) as typeof fetch;
  const result = await yandexDecide('room', repo, () => {})(request);
  expect(result.speech).toBe('Let us test this team.');
  expect(cost()).toBe(230);
});
test('budget rejection prevents HTTP and ambiguous failure retains reservation', async () => {
  const { repo, cost } = setup();
  let sent = false;
  global.fetch = (async () => {
    sent = true;
    throw Error('timeout');
  }) as typeof fetch;
  const blocked = {
    ...repo,
    reserve: async () => {
      throw new AiPause('budget');
    },
  } as unknown as AiRepository;
  await expect(yandexDecide('room', blocked, () => {})(request)).rejects.toThrow('budget');
  expect(sent).toBe(false);
  await expect(yandexDecide('room', repo, () => {})(request)).rejects.toThrow('AI request failed');
  expect(cost()).toBeGreaterThan(0);
});

test('stop during reservation never sends a paid request and refunds unsent reservation', async () => {
  const { repo, cost } = setup();
  const controller = new AbortController();
  const reserve = repo.reserve.bind(repo);
  repo.reserve = async (room, units) => {
    await reserve(room, units);
    controller.abort();
  };
  let sent = false;
  global.fetch = (async () => {
    sent = true;
    throw Error('must not send');
  }) as typeof fetch;
  await expect(yandexDecide('room', repo, () => {})(request, controller.signal)).rejects.toThrow();
  expect(sent).toBe(false);
  expect(cost()).toBe(0);
});

test('states a servants actual side, loss and own mission card explicitly in the request', async () => {
  const { repo } = setup();
  let sent = '';
  global.fetch = (async (_url, options) => {
    sent = JSON.parse(options!.body as string).messages[1].content;
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10 },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"We lost."}' } }],
      }),
    );
  }) as typeof fetch;
  const state = {
    stage: 'end',
    mission: 2,
    result: { winner: 'evil', reason: 'evilTeamMissions' },
    players: [{ id: 'bot', index: 4, role: 'servant', features: {} }],
    settings: { missions: [] },
    history: [
      { type: 'mission', index: 0, result: 'fail', fails: 1, actions: [{ playerID: 'bot', value: 'success' }] },
    ],
  } as unknown as VisualGameState;
  await yandexDecide('room', repo, () => {})({ ...request, state });
  const payload = JSON.parse(sent);
  expect(payload.you).toEqual({ seat: 4, role: 'servant', side: 'good', outcome: 'lost' });
  expect(payload.missions[0].yourCard).toBe('success');
});

test('compact context strips internal IDs and bounds repeated chat and vote history', () => {
  const state = {
    mission: 0,
    players: [{ id: 'internal-id', index: 6, role: 'servant', features: {} }],
    history: Array.from({ length: 30 }, () => ({
      type: 'vote',
      leaderID: 'internal-id',
      team: [{ id: 'internal-id' }],
      votes: [{ playerID: 'internal-id', value: 'reject' }],
      result: 'reject',
    })),
    uuid: 'private-room-identifier',
    irrelevant: 'x'.repeat(20000),
  } as unknown as VisualGameState;
  const compact = compactRequest({
    ...request,
    playerID: 'internal-id',
    state,
    chat: Array.from({ length: 30 }, () => ({ name: '6', text: 'a'.repeat(500) })),
  });
  expect(compact.votes).toHaveLength(4);
  expect(compact.chat).toHaveLength(7);
  expect(compact.chat.every((m) => m.text.length <= 240)).toBe(true);
  const serialized = JSON.stringify(compact);
  expect(serialized).not.toContain('internal-id');
  expect(serialized).not.toContain('private-room-identifier');
  expect(serialized.length).toBeLessThan(4000);
});

test('Qwen only discounts confirmed cached input', async () => {
  const { repo, cost } = setup();
  let model = '';
  global.fetch = (async (_url, options) => {
    model = JSON.parse(options!.body as string).model;
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 80 } },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"I agree."}' } }],
      }),
    );
  }) as typeof fetch;
  await yandexDecide('room', repo, () => {})(request);
  expect(model).toBe('gpt://folder/qwen3.6-35b-a3b');
  expect(cost()).toBe(110);
});
