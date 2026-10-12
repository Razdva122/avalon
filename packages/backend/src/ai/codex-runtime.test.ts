import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import { writeFile, access } from 'fs/promises';
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
