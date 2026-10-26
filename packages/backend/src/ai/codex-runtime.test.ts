import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import { writeFile, access } from 'fs/promises';
import timers from 'timers/promises';
import { runCodex, codexSchema } from './codex';

jest.mock('child_process', () => ({ spawn: jest.fn() }));
const mockedSpawn = spawn as jest.Mock;
const previous = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  mockedSpawn.mockReset();
  process.env = { ...previous };
});

function fakeChild(onInput: (child: EventEmitter, args: string[]) => void) {
  mockedSpawn.mockImplementation((_bin, args) => {
    const child = Object.assign(new EventEmitter(), {
      pid: 123456789,
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new PassThrough(),
      kill: jest.fn(),
    });
    child.stdin.on('finish', () => onInput(child, args));
    return child;
  });
}

test('runner forces ChatGPT, removes backend secrets, disables tools, parses usage and removes temporary files', async () => {
  process.env.UNRELATED_SERVICE_SECRET = 'must-not-be-passed';
  process.env.SECRET_KEY = 'must-not-be-passed';
  process.env.CODEX_API_KEY = 'must-not-be-passed';
  let output = '';
  fakeChild((child, args) => {
    output = args[args.indexOf('-o') + 1];
    void writeFile(output, '{"choice":"approve","speech":"test"}').then(() => {
      mockedSpawn.mock.results[0].value.stdout.write(
        JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 42 } }) + '\n',
      );
      child.emit('close', 0);
    });
  });
  const result = await runCodex('game input', codexSchema(['approve'], false));
  expect(result.usage.input_tokens).toBe(42);
  const [, args, options] = mockedSpawn.mock.calls[0];
  expect(args).toContain('forced_login_method="chatgpt"');
  expect(args).toContain('features.shell_tool=false');
  expect(args).toContain('features.unified_exec=false');
  expect(args).toContain('web_search="disabled"');
  expect(options.env.UNRELATED_SERVICE_SECRET).toBeUndefined();
  expect(options.env.SECRET_KEY).toBeUndefined();
  expect(options.env.CODEX_API_KEY).toBeUndefined();
  await expect(access(output)).rejects.toThrow();
});

test('Stop abort kills the Codex process group and rejects the reply', async () => {
  const abort = new AbortController();
  const kill = jest.spyOn(process, 'kill').mockImplementation(() => {
    queueMicrotask(() => mockedSpawn.mock.results[0].value.emit('close', null));
    return true;
  });
  fakeChild(() => abort.abort());
  await expect(runCodex('game input', codexSchema(['approve'], false), abort.signal)).rejects.toThrow('cancelled');
  expect(kill).toHaveBeenCalledWith(-123456789, 'SIGKILL');
});

test('runner uses the model and reasoning selected for this party', async () => {
  fakeChild((child, args) => {
    void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}').then(() =>
      child.emit('close', 0),
    );
  });
  await runCodex('input', codexSchema(['approve'], false), undefined, { model: 'gpt-6-luna', reasoning: 'high' });
  const args = mockedSpawn.mock.calls[0][1];
  expect(args[args.indexOf('--model') + 1]).toBe('gpt-6-luna');
  expect(args).toContain('model_reasoning_effort="high"');
});

test('reusable instructions stay separate from changing private game input', async () => {
  const inputs: string[] = [];
  fakeChild((child, args) => {
    inputs.push((child as EventEmitter & { stdin: PassThrough }).stdin.read().toString());
    void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}').then(() => {
      mockedSpawn.mock.results[mockedSpawn.mock.results.length - 1].value.stdout.write(
        JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 100, cached_input_tokens: 64 } }) + '\n',
      );
      child.emit('close', 0);
    });
  });
  const instructions = 'Play Avalon. Keep roles private.';
  for (const privateState of ['PRIVATE_FIRST_STATE', 'PRIVATE_SECOND_STATE']) {
    const result = await runCodex(
      instructions + '\nGAME INPUT:\n' + privateState,
      codexSchema(['approve'], false),
      undefined,
      undefined,
      instructions,
    );
    expect(result.usage.cached_input_tokens).toBe(64);
  }
  expect(inputs).toEqual(['\nGAME INPUT:\nPRIVATE_FIRST_STATE', '\nGAME INPUT:\nPRIVATE_SECOND_STATE']);
  for (const [, args] of mockedSpawn.mock.calls) {
    expect(args).toContain('developer_instructions="Play Avalon. Keep roles private."');
    expect(args).toContain('include_environment_context=false');
    expect(args).toContain('--ephemeral');
    expect(JSON.stringify(args)).not.toContain('PRIVATE_');
  }
});

test('a mismatched instruction prefix cannot discard game input or start Codex', async () => {
  await expect(
    runCodex('private game input', codexSchema(['approve'], false), undefined, undefined, 'different prefix'),
  ).rejects.toThrow('instruction prefix');
  expect(mockedSpawn).not.toHaveBeenCalled();
});

test.each([false, true])('local failed turn retries only once (alwaysFails=%s)', async (alwaysFails) => {
  delete process.env.AI_CODEX_SSH_HOST;
  let attempts = 0;
  fakeChild((child, args) => {
    attempts++;
    const current = mockedSpawn.mock.results[attempts - 1].value;
    if (attempts === 1 || alwaysFails) {
      current.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
      child.emit('close', 1);
    } else {
      void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"recovered"}').then(() =>
        child.emit('close', 0),
      );
    }
  });
  const result = runCodex('game', codexSchema(['approve'], false));
  if (alwaysFails) await expect(result).rejects.toThrow('could not complete');
  else expect(JSON.parse((await result).text).speech).toBe('recovered');
  expect(attempts).toBe(2);
});

test.each(['error', 'turn.failed'])('local usage limit in %s pauses without retry', async (eventType) => {
  delete process.env.AI_CODEX_SSH_HOST;
  let attempts = 0;
  fakeChild((child) => {
    attempts++;
    mockedSpawn.mock.results[attempts - 1].value.stdout.write(
      JSON.stringify({ type: eventType, error: { message: 'You have hit your usage limit' } }) + '\n',
    );
    if (eventType === 'error')
      mockedSpawn.mock.results[attempts - 1].value.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toThrow('usage limit');
  expect(attempts).toBe(1);
});

test.each(['error', 'turn.failed'])('local HTTP 429 in %s waits before bounded retries', async (eventType) => {
  delete process.env.AI_CODEX_SSH_HOST;
  const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
  let attempts = 0;
  fakeChild((child) => {
    const current = mockedSpawn.mock.results[attempts++].value;
    current.stdout.write(JSON.stringify({ type: eventType, error: { message: 'HTTP 429' } }) + '\n');
    current.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toMatchObject({ codexAttempts: 4 });
  expect(attempts).toBe(4);
  expect(delay).toHaveBeenCalledTimes(3);
  delay.mock.calls.forEach(([ms], i) => {
    expect(ms).toBeGreaterThanOrEqual(10000 * 2 ** i);
    expect(ms).toBeLessThanOrEqual(10000 * 2 ** i + 1000);
  });
});

test('stop after a failed turn prevents the automatic retry', async () => {
  delete process.env.AI_CODEX_SSH_HOST;
  const controller = new AbortController();
  let attempts = 0;
  jest.spyOn(process, 'kill').mockImplementation(() => true);
  fakeChild((child) => {
    attempts++;
    mockedSpawn.mock.results[attempts - 1].value.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
    controller.abort();
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false), controller.signal)).rejects.toThrow('cancelled');
  expect(attempts).toBe(1);
});

test('a forbidden tool error cannot become retryable through a later failed-turn event', async () => {
  delete process.env.AI_CODEX_SSH_HOST;
  let attempts = 0;
  jest.spyOn(process, 'kill').mockImplementation(() => true);
  fakeChild((child) => {
    attempts++;
    const current = mockedSpawn.mock.results[attempts - 1].value;
    current.stdout.write(JSON.stringify({ type: 'item.completed', item: { type: 'command_execution' } }) + '\n');
    current.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toThrow('tool');
  expect(attempts).toBe(1);
});

test.each([
  { message: 'HTTP 429', code: 'insufficient_quota' },
  { message: 'HTTP 429', type: 'insufficient_quota' },
  { message: 'HTTP 429 {"code":"insufficient_quota"}' },
])('local structured quota exhaustion is terminal: %s', async (error) => {
  delete process.env.AI_CODEX_SSH_HOST;
  const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
  fakeChild((child) => {
    mockedSpawn.mock.results[mockedSpawn.mock.calls.length - 1].value.stdout.write(
      JSON.stringify({ type: 'turn.failed', error }) + '\n',
    );
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toThrow('usage limit');
  expect(mockedSpawn).toHaveBeenCalledTimes(1);
  expect(delay).not.toHaveBeenCalled();
});

test.each(['HTTP 429\nRetry-After: 37', 'HTTP 429\nRetry-After: Mon, 26 Oct 2026 15:00:37 GMT  \n'])(
  'local Retry-After delays the retry: %s',
  async (message) => {
    delete process.env.AI_CODEX_SSH_HOST;
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-26T15:00:00Z'));
    const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
    let n = 0;
    fakeChild((child, args) => {
      const current = mockedSpawn.mock.results[n++].value;
      if (n === 1) {
        current.stdout.write(JSON.stringify({ type: 'turn.failed', error: { message } }) + '\n');
        child.emit('close', 1);
      } else void writeFile(args[args.indexOf('-o') + 1], '{}').then(() => child.emit('close', 0));
    });
    await expect(runCodex('game', codexSchema(['approve'], false))).resolves.toMatchObject({ attempts: 2 });
    expect(delay.mock.calls[0][0]).toBeGreaterThanOrEqual(37000);
  },
);
