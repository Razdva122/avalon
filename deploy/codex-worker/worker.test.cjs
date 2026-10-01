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
