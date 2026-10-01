import { codexDecide, codexSchema, codexEnabled, CODEX_MODEL } from './codex';
import { decisionPipeline } from './pipeline';
import type { BotRequest } from './client';
import fixtures from './fixtures/control.json';

const request = fixtures[0].request as unknown as BotRequest;
const oldEnv = { ...process.env };
afterEach(() => {
  process.env = { ...oldEnv };
});

test('Codex is opt-in development only, even if production enables the flag', () => {
  process.env.AI_CODEX_ENABLED = 'true';
  process.env.NODE_ENV = 'development';
  expect(codexEnabled()).toBe(true);
  process.env.NODE_ENV = 'production';
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
