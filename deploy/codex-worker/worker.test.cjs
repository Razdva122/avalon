const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRequest } = require('./worker.cjs');
const { spawn } = require('node:child_process');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

test('worker rejects arbitrary operations, configuration injection and oversized input', () => {
  assert.throws(() => validateRequest({ operation: 'shell', command: 'id' }));
  assert.throws(() =>
    validateRequest({ operation: 'decide', prompt: 'game', schema: {}, settings: { model: '-c', reasoning: 'low' } }),
  );
  assert.throws(() => validateRequest({ operation: 'decide', prompt: 'x'.repeat(600000), schema: {} }));
  assert.throws(() => validateRequest({ operation: 'models', command: 'id' }));
});

test('worker returns a bounded decision and usage from a CLI subprocess', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-test-'));
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nconst fs=require('node:fs');const args=process.argv.slice(2);process.stdin.resume();process.stdin.on('end',()=>{if(!args.includes('features.shell_tool=false')||!args.includes('forced_login_method="chatgpt"'))process.exit(2);fs.writeFileSync(args[args.indexOf('-o')+1],'{"choice":"approve","speech":"test"}');console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:42,output_tokens:3}}));});`,
      { mode: 0o700 },
    );
    const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    const done = new Promise((resolve) => child.on('close', resolve));
    child.stdin.end(
      JSON.stringify({
        operation: 'decide',
        prompt: 'game input',
        schema: { type: 'object' },
        settings: { model: 'gpt-6.1-sol', reasoning: 'low' },
      }),
    );
    assert.equal(await done, 0);
    const response = JSON.parse(stdout);
    assert.equal(response.ok, true);
    assert.deepEqual(JSON.parse(response.result.text), { choice: 'approve', speech: 'test' });
    assert.equal(response.result.usage.input_tokens, 42);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('worker refuses a CLI tool execution instead of returning a decision', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-test-'));
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nprocess.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'item.completed',item:{type:'command_execution'}}));setInterval(()=>{},1000)});`,
      { mode: 0o700 },
    );
    const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    const done = new Promise((resolve) => child.on('close', resolve));
    child.stdin.end(JSON.stringify({ operation: 'decide', prompt: 'game input', schema: { type: 'object' } }));
    assert.equal(await done, 0);
    assert.equal(JSON.parse(stdout).ok, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('worker accepts only game decision input or read-only discovery operations', () => {
  assert.doesNotThrow(() =>
    validateRequest({
      operation: 'decide',
      prompt: 'game',
      schema: { type: 'object' },
      settings: { model: 'gpt-6.1-sol', reasoning: 'low' },
    }),
  );
  assert.doesNotThrow(() => validateRequest({ operation: 'models' }));
  assert.doesNotThrow(() => validateRequest({ operation: 'limits' }));
});

test('worker reports exhausted subscription quota without exposing raw CLI diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-quota-test-'));
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nprocess.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:'You’ve hit your usage limit. PRIVATE_DIAGNOSTIC'}}));setInterval(()=>{},1000)});`,
      { mode: 0o700 },
    );
    const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    const done = new Promise((resolve) => child.on('close', resolve));
    child.stdin.end(JSON.stringify({ operation: 'decide', prompt: 'game', schema: { type: 'object' } }));
    assert.equal(await done, 0);
    assert.deepEqual(JSON.parse(stdout), { ok: false, error: 'usage_limit' });
    assert.equal(stdout.includes('PRIVATE_DIAGNOSTIC'), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('decision timeout terminates the CLI wrapper and its descendants', { timeout: 5000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-descendants-'));
  let worker;
  let descendant;
  try {
    const source = (await require('node:fs/promises').readFile(join(__dirname, 'worker.cjs'), 'utf8')).replace(
      'const TIMEOUT = 10 * 60 * 1000;',
      'const TIMEOUT = 500;',
    );
    await writeFile(join(directory, 'worker.cjs'), source);
    const pidFile = join(directory, 'descendant');
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nconst {spawn}=require('node:child_process');const fs=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});fs.writeFileSync(${JSON.stringify(pidFile)},String(c.pid));process.stderr.write('stream disconnected before completion PRIVATE_TOKEN\\n');console.log(JSON.stringify({type:'thread.started'}));setInterval(()=>{},1000);`,
      { mode: 0o700 },
    );
    worker = spawn(process.execPath, [join(directory, 'worker.cjs')], {
      env: { ...process.env, CODEX_HOME: directory, PATH: `${directory}:${process.env.PATH}` },
    });
    let stdout = '';
    worker.stdout.on('data', (chunk) => (stdout += chunk));
    const done = new Promise((resolve) => worker.on('close', resolve));
    worker.stdin.end(JSON.stringify({ operation: 'decide', prompt: 'game', schema: {} }));
    const result = await Promise.race([done, new Promise((resolve) => setTimeout(() => resolve('hung'), 1800))]);
    descendant = Number(await require('node:fs/promises').readFile(pidFile, 'utf8'));
    assert.equal(result, 0, 'grandchild pipes must not keep the worker or its lock alive after timeout');
    assert.equal(JSON.parse(stdout).error, 'timeout');
    const diagnostic = JSON.parse(
      await require('node:fs/promises').readFile(join(directory, 'avalon-last-failure.json'), 'utf8'),
    );
    assert.equal(diagnostic.reason, 'timeout');
    assert.equal(diagnostic.transport, 'connection');
    assert.equal(diagnostic.lastEvent, 'thread.started');
    assert.doesNotMatch(JSON.stringify(diagnostic), /PRIVATE_TOKEN|game input/);
    if (process.platform === 'linux') {
      // A container's PID 1 may not reap an orphan immediately; zombies hold no pipes or locks.
      let state;
      try {
        state = await require('node:fs/promises').readFile(`/proc/${descendant}/stat`, 'utf8');
      } catch (error) {
        assert.equal(error.code, 'ENOENT');
      }
      if (state) assert.equal(state.slice(state.lastIndexOf(')') + 2, state.lastIndexOf(')') + 3), 'Z');
    } else assert.throws(() => process.kill(descendant, 0), { code: 'ESRCH' });
  } finally {
    worker?.kill('SIGKILL');
    if (descendant) {
      try {
        process.kill(descendant, 'SIGKILL');
      } catch {}
    }
    await rm(directory, { recursive: true, force: true });
  }
});
