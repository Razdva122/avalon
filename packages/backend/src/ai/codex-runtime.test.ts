import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { execFile, spawn } from 'child_process';
import { writeFile, access, readFile } from 'fs/promises';
import timers from 'timers/promises';
import { runCodex, codexSchema } from './codex';

jest.mock('child_process', () => ({ spawn: jest.fn(), execFile: jest.fn() }));
const mockedSpawn = spawn as jest.Mock;
const mockedExecFile = execFile as unknown as jest.Mock;
// Without a catalog from `codex debug models` the runner keeps Codex's own tools.
beforeEach(() =>
  mockedExecFile.mockImplementation((_bin, _args, _options, callback) => callback(new Error('no catalog'))),
);
const previous = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  mockedSpawn.mockReset();
  mockedExecFile.mockReset();
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

test('the model runs with a one-line base prompt and its own catalog entry without coding tools', async () => {
  process.env.AI_CODEX_HOME = '/tmp/lean-catalog-home';
  const entry = {
    slug: 'gpt-6-luna',
    tool_mode: 'code_mode_only',
    multi_agent_version: 'v2',
    experimental_supported_tools: ['clock'],
    context_window: 272000,
  };
  mockedExecFile.mockImplementation((_bin, args, _options, callback) =>
    callback(null, { stdout: JSON.stringify({ models: [{ slug: 'other' }, entry] }), stderr: '' }),
  );
  const files: Record<string, string> = {};
  fakeChild((child, args) => {
    const path = (key: string) => {
      const arg = args.find((value) => value.startsWith(`${key}=`));
      return arg && JSON.parse(arg.slice(key.length + 1));
    };
    void Promise.all(
      ['model_catalog_json', 'model_instructions_file'].map((key) => path(key) && readFile(path(key), 'utf8')),
    )
      .then(([catalog, base]) => files.catalog ?? Object.assign(files, { catalog, base }))
      .then(() => writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}'))
      .then(() => child.emit('close', 0));
  });
  await runCodex('input', codexSchema(['approve'], false), undefined, { model: 'gpt-6-luna', reasoning: 'low' });
  expect(mockedExecFile.mock.calls[0][1]).toEqual(['debug', 'models']);
  // Only fields this Codex's catalog has change.
  expect(JSON.parse(files.catalog)).toEqual({
    models: [{ ...entry, tool_mode: 'direct', multi_agent_version: null, experimental_supported_tools: [] }],
  });
  expect(files.base).toContain('Avalon');
  const args = mockedSpawn.mock.calls[0][1];
  expect(args).toContain('skills.include_instructions=false');
  expect(args).toContain('include_permissions_instructions=false');
  // The catalog is read once per binary and home; AI_CODEX_LEAN=off restores Codex's defaults.
  await runCodex('input', codexSchema(['approve'], false), undefined, { model: 'gpt-6-luna', reasoning: 'low' });
  expect(mockedExecFile).toHaveBeenCalledTimes(1);
  process.env.AI_CODEX_LEAN = 'off';
  await runCodex('input', codexSchema(['approve'], false), undefined, { model: 'gpt-6-luna', reasoning: 'low' });
  const plain = mockedSpawn.mock.calls[2][1] as string[];
  expect(plain.some((arg) => /model_catalog_json|model_instructions_file|skills\.include/.test(arg))).toBe(false);
});

test('a model missing from the catalog runs on Codex defaults for its tools', async () => {
  process.env.AI_CODEX_HOME = '/tmp/missing-catalog-home';
  mockedExecFile.mockImplementation((_bin, _args, _options, callback) =>
    callback(null, { stdout: JSON.stringify({ models: [{ slug: 'other' }] }), stderr: '' }),
  );
  fakeChild((child, args) => {
    void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}').then(() =>
      child.emit('close', 0),
    );
  });
  await runCodex('input', codexSchema(['approve'], false), undefined, { model: 'gpt-6-luna', reasoning: 'low' });
  const args = mockedSpawn.mock.calls[0][1] as string[];
  expect(args.some((arg) => arg.startsWith('model_catalog_json='))).toBe(false);
  expect(args.some((arg) => arg.startsWith('model_instructions_file='))).toBe(true);
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

test.each(['error', 'turn.failed'])('local HTTP 429 in %s waits before one retry', async (eventType) => {
  delete process.env.AI_CODEX_SSH_HOST;
  const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
  let attempts = 0;
  fakeChild((child) => {
    const current = mockedSpawn.mock.results[attempts++].value;
    current.stdout.write(JSON.stringify({ type: eventType, error: { message: 'HTTP 429' } }) + '\n');
    current.stdout.write(JSON.stringify({ type: 'turn.failed' }) + '\n');
    child.emit('close', 1);
  });
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toMatchObject({ codexAttempts: 2 });
  expect(attempts).toBe(2);
  expect(delay).toHaveBeenCalledTimes(1);
  expect(delay).toHaveBeenCalledWith(10000, undefined, { signal: undefined });
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
