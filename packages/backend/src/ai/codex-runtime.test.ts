import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import { writeFile, access } from 'fs/promises';
import { runCodex, codexSchema, experimentalCodexSessionRunner, buildCodexPrompt } from './codex';

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

test('persistent runner submits only new state and reuses stable instructions on resume', async () => {
  const inputs: string[] = [];
  fakeChild((child, args) => {
    const c = child as EventEmitter & { stdout: PassThrough; stdin: PassThrough };
    inputs.push(c.stdin.read().toString());
    c.stdout.write(
      JSON.stringify({ type: 'thread.started', thread_id: '11111111-1111-4111-8111-111111111111' }) + '\n',
    );
    c.stdout.write(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: inputs.length * 100 } }) + '\n');
    void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}').then(() =>
      child.emit('close', 0),
    );
  });
  const runner = experimentalCodexSessionRunner('/tmp/avalon-owned-test-home');
  for (const stage of ['selectTeam', 'votingForTeam']) {
    const built = buildCodexPrompt(
      'COMMON. ' + stage,
      { privateRole: 'merlin', stage, choices: ['approve'] },
      'COMMON. ',
    );
    await runner(built.prompt, codexSchema(['approve'], false), undefined, undefined, built.instructions);
  }
  expect(inputs[0]).toContain('merlin');
  expect(inputs[1]).not.toContain('merlin');
  expect(inputs[1]).not.toContain('COMMON');
  const parse = (s: string) => JSON.parse(s.split('\nSESSION INPUT:\n')[1]);
  expect(parse(inputs[1]).state.set).toEqual({ stage: 'votingForTeam' });
  const developer = mockedSpawn.mock.calls.map(([, args]) =>
    args.find((a: string) => a.startsWith('developer_instructions=')),
  );
  expect(developer[0]).toBe(developer[1]);
});

test('experimental sessions resume only their own thread and keep the ordinary runner ephemeral', async () => {
  const sessions = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
  fakeChild((child, args) => {
    const stream = (child as EventEmitter & { stdout: PassThrough }).stdout;
    const id = args.includes('resume') ? args[args.indexOf('resume') + 1] : sessions.shift();
    stream.write(JSON.stringify({ type: 'thread.started', thread_id: id }) + '\n');
    stream.write(
      JSON.stringify({ type: 'turn.completed', usage: { input_tokens: args.includes('resume') ? 30 : 12 } }) + '\n',
    );
    void writeFile(args[args.indexOf('-o') + 1], '{"choice":"approve","speech":"test"}').then(() =>
      child.emit('close', 0),
    );
  });
  const first = experimentalCodexSessionRunner('/tmp/avalon-owned-test-home');
  const second = experimentalCodexSessionRunner('/tmp/avalon-owned-test-home');
  const schema = codexSchema(['approve'], false);
  await first('first bot', schema);
  await second('second bot', schema);
  expect((await first('first bot again', schema)).usage.input_tokens).toBe(18);
  await runCodex('ordinary', schema);
  const calls = mockedSpawn.mock.calls;
  expect(calls[0][1]).not.toContain('--ephemeral');
  expect(calls[1][1]).not.toContain('resume');
  expect(calls[2][1].slice(0, 3)).toEqual(['exec', 'resume', '11111111-1111-4111-8111-111111111111']);
  expect(calls[2][1]).not.toContain('--sandbox');
  expect(calls[2][1]).not.toContain('-C');
  expect(calls[2][1]).toContain('sandbox_mode="read-only"');
  expect(calls[2][2].env.CODEX_HOME).toBe('/tmp/avalon-owned-test-home');
  expect(calls[2][2].cwd).toBe('/tmp/avalon-owned-test-home/work');
  expect(calls[3][1]).toContain('--ephemeral');
});

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

test('production sessions resume remote native threads and subtract cumulative usage', async () => {
  const remote = await import('./codex-remote');
  const { codexGameSessions } = await import('./codex');
  jest.spyOn(remote, 'hasRemoteCodex').mockReturnValue(true);
  const thread = '11111111-1111-4111-8111-111111111111';
  const call = jest.spyOn(remote, 'remoteCodex').mockImplementation(async (request: object) => {
    const r = request as { operation: string; session?: { id?: string } };
    if (r.operation === 'closeSessions') return {};
    return { text: '{}', usage: { input_tokens: r.session?.id ? 300 : 100 }, threadID: thread };
  });
  const sessions = codexGameSessions();
  const runner = sessions.forPlayer('vera');
  const built = buildCodexPrompt('COMMON stage', { role: 'servant', turn: 1 }, 'COMMON');
  expect(
    (await runner(built.prompt, codexSchema(['yes'], false), undefined, undefined, built.instructions)).usage
      .input_tokens,
  ).toBe(100);
  expect(
    (await runner(built.prompt, codexSchema(['yes'], false), undefined, undefined, built.instructions)).usage
      .input_tokens,
  ).toBe(200);
  const first = call.mock.calls[0][0] as { session: { key: string; id?: string } };
  const second = call.mock.calls[1][0] as { session: { key: string; id?: string } };
  expect(first.session.id).toBeUndefined();
  expect(second.session).toEqual({ key: first.session.key, id: thread });
  await sessions.close();
  expect(call.mock.calls[2][0]).toEqual({ operation: 'closeSessions', keys: [first.session.key] });
});

test('a rejected downstream reply resets only that bot on the next technical attempt', async () => {
  const remote = await import('./codex-remote');
  const { codexGameSessions } = await import('./codex');
  jest.spyOn(remote, 'hasRemoteCodex').mockReturnValue(true);
  const call = jest.spyOn(remote, 'remoteCodex').mockImplementation(async (request: object) => {
    const r = request as { operation: string; session?: { key: string; id?: string } };
    if (r.operation === 'closeSessions') return {};
    return { text: '{}', usage: { input_tokens: r.session?.id ? 200 : 100 }, threadID: r.session?.key };
  });
  const sessions = codexGameSessions();
  const built = buildCodexPrompt('COMMON stage', { role: 'servant' }, 'COMMON');
  const args = [built.prompt, codexSchema(['yes'], false), undefined, undefined, built.instructions] as const;
  const vera = sessions.forPlayer('vera');
  const lada = sessions.forPlayer('lada');
  await vera(...args);
  await lada(...args);
  sessions.invalidate('vera');
  expect((await vera(...args)).sessionReset).toBe(true);
  expect((await lada(...args)).sessionReset).toBe(false);
  const requests = call.mock.calls.map(([r]) => r as { session: { key: string; id?: string }; prompt: string });
  expect(requests[2].session.key).not.toBe(requests[0].session.key);
  expect(requests[2].session.id).toBeUndefined();
  expect(requests[2].prompt).toContain('servant');
  expect(requests[3].session.id).toBe(requests[1].session.key);
  await sessions.close();
});
