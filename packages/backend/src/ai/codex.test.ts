import { codexDecide, codexSchema, codexEnabled, CODEX_MODEL } from './codex';
import { decisionPipeline } from './pipeline';
import type { BotRequest } from './client';
import fixtures from './fixtures/control.json';

const request = fixtures[0].request as unknown as BotRequest;
const oldEnv = { ...process.env };
afterEach(() => {
  process.env = { ...oldEnv };
});

test('Codex is opt-in in development and production, disabled in other environments', () => {
  process.env.AI_CODEX_ENABLED = 'true';
  process.env.NODE_ENV = 'development';
  expect(codexEnabled()).toBe(true);
  process.env.NODE_ENV = 'production';
  expect(codexEnabled()).toBe(true);
  process.env.NODE_ENV = 'test';
  expect(codexEnabled()).toBe(false);
  delete process.env.NODE_ENV;
  expect(codexEnabled()).toBe(false);
  process.env.NODE_ENV = 'development';
  delete process.env.AI_CODEX_ENABLED;
  expect(codexEnabled()).toBe(false);
  expect(CODEX_MODEL).toBe('codex-chatgpt');
});

test('structured output applies parser limits to evidence, including the failed experiment source', () => {
  const schema = codexSchema(request.choices, true);
  expect(schema.properties.evidence!.items.properties.source.maxLength).toBe(160);
  expect(schema.properties.evidence!.items.properties.fact.maxLength).toBe(240);
  expect(schema.properties.evidence!.maxItems).toBe(6);
  expect(schema.properties.choice.enum).toEqual(request.choices);
});

test('structured output permits a stance on an eighth-seat Percival claim', () => {
  const r = {
    ...request,
    playerID: 'seat-1',
    speak: true,
    state: {
      ...request.state,
      stage: 'selectTeam',
      players: Array.from({ length: 8 }, (_, i) => ({
        id: `seat-${i + 1}`,
        index: i + 1,
        role: i === 0 ? 'merlin' : 'unknown',
      })),
    },
    chat: [{ name: '8', text: 'I am Percival. 2 is Morgana.' }],
  } as unknown as BotRequest;
  const schema = codexSchema(r.choices, true, false, r);
  expect(schema.properties.claimMorgana!.enum).toContain(8);
  const seat = schema.properties.claimStances!.items.properties.seat;
  expect(seat.enum).toEqual([8]);
  expect(seat.maximum).toBeGreaterThanOrEqual(8);
});

test('Codex uses existing private/public pipeline and records subscription usage without RUB charges', async () => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const recordDecision = jest.fn().mockResolvedValue(undefined);
  const recordRequest = jest.fn().mockResolvedValue(undefined);
  const renewLease = jest.fn().mockResolvedValue(undefined);
  const runner = jest.fn().mockImplementation(async (_prompt, schema) => ({
    text: JSON.stringify({
      choice: schema.properties.choice.enum[0],
      speech: 'I favor this team.',
      ...(schema.properties.evidence
        ? { publicReason: 'This is a reasonable team.', evidence: [], claimMorgana: null, claimStances: [] }
        : {}),
    }),
    usage: { input_tokens: 100, cached_input_tokens: 20, output_tokens: 30 },
  }));
  const decide = decisionPipeline(codexDecide('local-match', { recordDecision, recordRequest, renewLease }, runner));
  const reply = await decide({ ...request, speak: true });
  expect(reply.choice).toBeGreaterThanOrEqual(0);
  expect(runner).toHaveBeenCalledTimes(2);
  const publicPrompt = JSON.parse(runner.mock.calls[1][0].split('\nGAME INPUT:\n')[1]);
  expect(publicPrompt.you).toBeUndefined();
  expect(publicPrompt.privateKnowledge).toBeUndefined();
  expect(publicPrompt.modelHypotheses).toBeUndefined();
  expect(recordRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: 'codex-chatgpt',
      inputTokens: 100,
      cachedTokens: 20,
      outputTokens: 30,
      status: 'completed',
    }),
  );
  expect(recordRequest.mock.calls.every(([r]) => r.actualUnits === undefined && r.reserveUnits === undefined)).toBe(
    true,
  );
  expect(renewLease).toHaveBeenCalledTimes(2);
});

test('invalid output pauses instead of choosing a fallback and disabled Codex cannot invoke the runner', async () => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const runner = jest.fn().mockResolvedValue({ text: '{"choice":"illegal","speech":"test"}', usage: {} });
  const repo = { recordDecision: jest.fn(), recordRequest: jest.fn(), renewLease: jest.fn() };
  const generate = codexDecide('match', repo, runner);
  await expect(generate(request, { context: {}, phase: 'speech' })).rejects.toThrow();
  runner.mockClear();
  process.env.NODE_ENV = 'production';
  process.env.AI_CODEX_ENABLED = 'false';
  await expect(generate(request, { context: {} })).rejects.toThrow();
  expect(runner).not.toHaveBeenCalled();
});

test('final reflections use the same 800-character ceiling as BotRoom', () => {
  expect(codexSchema(['Write your conclusion'], false, true).properties.speech.maxLength).toBe(800);
});

test('CLI failures persist a failed request and private context before pausing', async () => {
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const repo = { recordDecision: jest.fn(), recordRequest: jest.fn(), renewLease: jest.fn() };
  const runner = jest.fn().mockRejectedValue(new Error('unavailable'));
  await expect(codexDecide('match', repo, runner)(request, { context: { marker: 'private' } })).rejects.toThrow();
  expect(repo.recordRequest.mock.calls[repo.recordRequest.mock.calls.length - 1][0]).toMatchObject({
    status: 'failed',
  });
  expect(repo.recordDecision.mock.calls[0][0].payload.context).toEqual({ marker: 'private' });
});

test.each([
  { role: 'mordred', stage: 'announceLoyalty', speak: false, chat: [], targets: [null], claimants: [] },
  { role: 'servant', stage: 'selectTeam', speak: true, chat: [], targets: [null], claimants: [] },
  {
    role: 'merlin',
    stage: 'selectTeam',
    speak: true,
    chat: [{ name: '2', text: 'I am Percival. 3 is Morgana.' }],
    targets: [null, 2, 3],
    claimants: [2],
  },
])(
  'runner schema admits only legal public claims for $role at $stage',
  async ({ role, stage, speak, chat, targets, claimants }) => {
    process.env.NODE_ENV = 'development';
    process.env.AI_CODEX_ENABLED = 'true';
    const current = {
      ...request,
      playerID: 'a',
      speak,
      chat,
      state: {
        ...request.state,
        stage,
        players: [
          { id: 'a', index: 1, role },
          { id: 'b', index: 2, role: 'unknown' },
          { id: 'c', index: 3, role: 'unknown' },
        ],
      },
    } as unknown as BotRequest;
    const runner = async (_prompt: string, schema: ReturnType<typeof codexSchema>) => {
      // These limits must be sent to the CLI, rather than merely checked after generation.
      expect(schema.properties.claimMorgana).toMatchObject({ enum: targets });
      expect(schema.properties.claimStances).toMatchObject({ minItems: claimants.length, maxItems: claimants.length });
      if (claimants.length)
        expect(schema.properties.claimStances!.items.properties.seat).toMatchObject({ enum: claimants });
      return {
        text: JSON.stringify({
          choice: current.choices[0],
          speech: 'I support this action.',
          publicReason: '',
          evidence: [],
          claimMorgana: null,
          claimStances: claimants.map((seat) => ({ seat, stance: 'distrust' })),
        }),
        usage: {},
      };
    };
    const repo = { recordDecision: jest.fn(), recordRequest: jest.fn(), renewLease: jest.fn() };
    expect((await codexDecide('match', repo, runner)(current, { decisionDetails: true })).choice).toBe(0);
  },
);
