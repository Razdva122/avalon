const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRequest } = require('./worker.cjs');
const { spawn } = require('node:child_process');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const resetKey = '8ae96ff3-3425-4f4c-8772-b6fd61502868';

test('worker validates reset UUID, optional credit ID and exact fields', () => {
  assert.doesNotThrow(() => validateRequest({ operation: 'reset', idempotencyKey: resetKey }));
  assert.doesNotThrow(() =>
    validateRequest({ operation: 'reset', idempotencyKey: resetKey, creditId: 'opaque:reset/test+value=' }),
  );
  assert.doesNotThrow(() =>
    validateRequest({ operation: 'reset', idempotencyKey: resetKey, creditId: 'x'.repeat(512) }),
  );
  for (const fields of [
    {},
    { idempotencyKey: '' },
    { idempotencyKey: 'not-a-uuid' },
    { idempotencyKey: 1 },
    { idempotencyKey: '8ae96ff3-3425-4f4c-8772-b6fd61502868\n' },
    ...['', 'x'.repeat(513), null, 1].map((creditId) => ({ idempotencyKey: resetKey, creditId })),
    { idempotencyKey: resetKey, prompt: 'injected' },
    { idempotencyKey: resetKey, settings: {} },
  ])
    assert.throws(() => validateRequest({ operation: 'reset', ...fields }));
});

async function withFakeResetServer(result, run) {
  const directory = await mkdtemp(join(tmpdir(), 'worker-reset-'));
  const transcript = join(directory, 'rpc.jsonl');
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nconst fs=require('node:fs');fs.appendFileSync(${JSON.stringify(transcript)},JSON.stringify({args:process.argv.slice(2)})+'\\n');if(process.argv[2]==='debug'){console.log('[]');}else if(process.argv[2]==='exec'){process.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:'HTTP 429'}}));setInterval(()=>{},1000)});}else{require('node:readline').createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line);fs.appendFileSync(${JSON.stringify(transcript)},line+'\\n');if(m.id===1)console.log(JSON.stringify({id:1,result:{}}));if(m.id===2)console.log(JSON.stringify({id:2,result:${JSON.stringify(result)}}));});}`,
      { mode: 0o700 },
    );
    await run(
      async (request) => {
        const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
          env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CODEX_HOME: directory },
        });
        let stdout = '';
        child.stdout.on('data', (chunk) => (stdout += chunk));
        const done = new Promise((resolve) => child.on('close', resolve));
        child.stdin.end(JSON.stringify(request));
        assert.equal(await done, 0);
        return JSON.parse(stdout);
      },
      async () => (await require('node:fs/promises').readFile(transcript, 'utf8')).trim().split('\n').map(JSON.parse),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

for (const outcome of ['reset', 'alreadyRedeemed', 'nothingToReset', 'noCredit']) {
  test(`worker passes a reset attempt unchanged once and sanitizes ${outcome}`, async () => {
    await withFakeResetServer(
      { outcome, account: 'PRIVATE_ACCOUNT', token: 'PRIVATE_TOKEN' },
      async (request, messages) => {
        const input = {
          operation: 'reset',
          idempotencyKey: resetKey,
          ...(outcome === 'reset' ? { creditId: 'opaque:reset/test+value=' } : {}),
        };
        assert.deepEqual(await request(input), { ok: true, result: { outcome } });
        const sent = await messages();
        assert.equal(sent.filter((m) => m.args).length, 1, 'one app-server subprocess per manual attempt');
        assert.deepEqual(
          sent.filter((m) => m.id === 2),
          [
            {
              id: 2,
              method: 'account/rateLimitResetCredit/consume',
              params: { idempotencyKey: resetKey, ...(input.creditId ? { creditId: 'opaque:reset/test+value=' } : {}) },
            },
          ],
        );
      },
    );
  });
}

for (const result of [null, {}, { outcome: 'unknown', token: 'PRIVATE_TOKEN' }, { outcome: 1 }, ['reset']]) {
  test(`worker fails safely for unexpected reset result ${JSON.stringify(result)}`, async () => {
    await withFakeResetServer(result, async (request, messages) => {
      assert.deepEqual(await request({ operation: 'reset', idempotencyKey: resetKey }), { ok: false, error: 'failed' });
      assert.equal((await messages()).filter((m) => m.method === 'account/rateLimitResetCredit/consume').length, 1);
    });
  });
}

test('worker discovery reads and failed decisions never consume a reset credit', async () => {
  await withFakeResetServer(
    { rateLimits: {}, rateLimitResetCredits: { availableCount: 1 } },
    async (request, messages) => {
      assert.equal((await request({ operation: 'limits' })).ok, true);
      assert.equal((await request({ operation: 'models' })).ok, true);
      assert.deepEqual(await request({ operation: 'decide', prompt: 'game', schema: {} }), {
        ok: false,
        error: 'rate_limit',
      });
      const sent = await messages();
      assert.deepEqual(
        sent.filter((m) => m.id === 2),
        [
          { id: 2, method: 'account/rateLimits/read' },
          { id: 2, method: 'account/rateLimits/read' },
        ],
      );
      assert.equal(sent.filter((m) => m.method === 'account/rateLimitResetCredit/consume').length, 0);
    },
  );
});

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
    assert.deepEqual(JSON.parse(stdout), { ok: false, error: 'forbidden_tool' });
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

test('worker separates reusable instructions and rejects a prefix that would discard game input', async () => {
  assert.throws(() =>
    validateRequest({ operation: 'decide', prompt: 'private state', instructions: 'other', schema: {} }),
  );
  const directory = await mkdtemp(join(tmpdir(), 'worker-cache-test-'));
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nconst fs=require('node:fs');const args=process.argv.slice(2);let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{if(input!=='\\nGAME INPUT:\\nPRIVATE_GAME_STATE'||args.some(a=>a.includes('PRIVATE_GAME_STATE'))||!args.includes('developer_instructions="Play Avalon."')||!args.includes('include_environment_context=false')||!args.includes('--ephemeral'))process.exit(2);fs.writeFileSync(args[args.indexOf('-o')+1],'{"choice":"approve","speech":"test"}');console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:100,cached_input_tokens:64}}));});`,
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
        prompt: 'Play Avalon.\nGAME INPUT:\nPRIVATE_GAME_STATE',
        instructions: 'Play Avalon.',
        schema: { type: 'object' },
      }),
    );
    assert.equal(await done, 0);
    const response = JSON.parse(stdout);
    assert.equal(response.ok, true);
    assert.equal(response.result.usage.cached_input_tokens, 64);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('worker runs the model with a one-line base prompt and its catalog entry without coding tools', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-lean-test-'));
  try {
    // The fake CLI lists one model and accepts a decision only with the lean base prompt and catalog.
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nconst fs=require('node:fs');const args=process.argv.slice(2);if(args[0]==='debug'){console.log(JSON.stringify({models:[{slug:'gpt-6-luna',tool_mode:'code_mode_only',multi_agent_version:'v2'}]}));process.exit(0)}const file=k=>JSON.parse(args.find(a=>a.startsWith(k+'=')).slice(k.length+1));process.stdin.resume();process.stdin.on('end',()=>{const model=JSON.parse(fs.readFileSync(file('model_catalog_json'),'utf8')).models[0];if(model.tool_mode!=='direct'||model.multi_agent_version!==null||!fs.readFileSync(file('model_instructions_file'),'utf8').includes('Avalon')||!args.includes('skills.include_instructions=false'))process.exit(2);fs.writeFileSync(args[args.indexOf('-o')+1],'{"choice":"approve","speech":"test"}');console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:360}}));});`,
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
        prompt: 'Play Avalon.\nGAME INPUT:\n{}',
        instructions: 'Play Avalon.',
        schema: { type: 'object' },
        settings: { model: 'gpt-6-luna', reasoning: 'low' },
      }),
    );
    assert.equal(await done, 0);
    const response = JSON.parse(stdout);
    assert.equal(response.ok, true);
    assert.equal(response.result.usage.input_tokens, 360);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('worker reports exhausted subscription quota without exposing raw CLI diagnostics', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-quota-test-'));
  try {
    await writeFile(
      join(directory, 'codex'),
      `#!${process.execPath}\nif(process.argv[2]==='app-server')process.exit(1);process.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:'You’ve hit your usage limit. PRIVATE_DIAGNOSTIC'}}));setInterval(()=>{},1000)});`,
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

for (const [message, category, httpStatus] of [
  ['Invalid schema for response_format. HTTP 400 PRIVATE_TOKEN', 'invalid_schema', 400],
  ['Rate limit reached. HTTP 429 PRIVATE_TOKEN', 'rate_limit', 429],
  ['Invalid response_format request. HTTP 429 PRIVATE_TOKEN', 'rate_limit', 429],
  ['Unexpected status code: 503 PRIVATE_TOKEN', 'server_error', 503],
]) {
  test(`worker stores safe ${category} diagnostics for a failed turn`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-error-test-'));
    try {
      await writeFile(
        join(directory, 'codex'),
        `#!${process.execPath}\nif(process.argv[2]==='app-server')process.exit(1);process.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:${JSON.stringify(message)}}}));setInterval(()=>{},1000)});`,
        { mode: 0o700 },
      );
      const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CODEX_HOME: directory },
      });
      let stdout = '';
      child.stdout.on('data', (chunk) => (stdout += chunk));
      const done = new Promise((resolve) => child.on('close', resolve));
      child.stdin.end(
        JSON.stringify({ operation: 'decide', prompt: 'PRIVATE_GAME_INPUT', schema: { type: 'object' } }),
      );
      assert.equal(await done, 0);
      assert.deepEqual(JSON.parse(stdout), { ok: false, error: category === 'rate_limit' ? 'rate_limit' : 'failed' });
      const diagnostic = JSON.parse(
        await require('node:fs/promises').readFile(join(directory, 'avalon-last-failure.json'), 'utf8'),
      );
      assert.equal(diagnostic.errorCategory, category);
      assert.equal(diagnostic.httpStatus, httpStatus);
      if (category === 'rate_limit') assert.equal(diagnostic.rateLimit.quota.status, 'unavailable');
      assert.doesNotMatch(JSON.stringify(diagnostic), /PRIVATE_TOKEN|PRIVATE_GAME_INPUT/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

for (const [message, kind, retryAfterSeconds, amounts, chunks] of [
  [
    'Rate limit reached on tokens per min (TPM): Limit 30000, Used 22999, Requested 12528. Please try again in 11.054s. PRIVATE_TOKEN',
    'tokens',
    11.054,
    { limit: 30000, used: 22999, requested: 12528 },
  ],
  ['Too many requests per minute. HTTP 429. Retry-After: 12\nPRIVATE_TOKEN', 'requests', 12],
  ['Too many concurrent requests. HTTP 429 PRIVATE_TOKEN', 'concurrency', undefined],
  ['Unexpected status code: 429 PRIVATE_TOKEN', 'unknown', undefined],
  [
    'Rate limit on tokens per min: Limit 30,000, Used 22999.5, Requested 1e3. Retry after 1.5h. HTTP 429',
    'tokens',
    undefined,
  ],
  ['HTTP 429. Retry after 2 hours.', 'unknown', undefined],
  [
    'Fragmented unsupported numbers',
    'unknown',
    undefined,
    undefined,
    ['HTTP 429. Limit 30000', '.5. Retry-After: 12', ' hours\n'],
  ],
]) {
  test(`worker keeps safe ${kind} limit diagnostics with an account quota snapshot`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-rate-limit-'));
    const quota = {
      rateLimitsByLimitId: {
        codex: {
          limitId: 'codex',
          primary: { usedPercent: 4, windowDurationMins: 300, resetsAt: 1791982189, token: 'PRIVATE_TOKEN' },
          secondary: { usedPercent: 21, windowDurationMins: 10080, resetsAt: 1792472863 },
          rateLimitReachedType: null,
          spendControlReached: false,
          account: 'PRIVATE_ACCOUNT',
        },
        codex_other: {
          limitId: 'codex_other',
          primary: { usedPercent: 100, windowDurationMins: 60, resetsAt: 1791982189 },
          secondary: null,
          rateLimitReachedType: kind === 'concurrency' ? 'PRIVATE_NEW_TYPE' : 'workspace_member_usage_limit_reached',
          spendControlReached: true,
        },
      },
      access_token: 'PRIVATE_TOKEN',
    };
    try {
      await writeFile(
        join(directory, 'codex'),
        `#!${process.execPath}\nif(process.argv[2]==='app-server'){require('node:readline').createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line);if(m.id===1)console.log(JSON.stringify({id:1,result:{}}));if(m.id===2)console.log(JSON.stringify({id:2,result:${JSON.stringify(quota)}}));});}else{process.stdin.resume();process.stdin.on('end',()=>{const parts=${JSON.stringify(chunks)};const fail=()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:parts?'':${JSON.stringify(message)}}}));setInterval(()=>{},1000)};if(parts){const next=()=>{if(!parts.length)return fail();process.stderr.write(parts.shift());setTimeout(next,20)};next()}else fail()});}`,
        { mode: 0o700 },
      );
      const child = spawn(process.execPath, [join(__dirname, 'worker.cjs')], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CODEX_HOME: directory },
      });
      let stdout = '';
      child.stdout.on('data', (chunk) => (stdout += chunk));
      const done = new Promise((resolve) => child.on('close', resolve));
      child.stdin.end(JSON.stringify({ operation: 'decide', prompt: 'PRIVATE_GAME_INPUT', schema: {} }));
      assert.equal(await done, 0);
      assert.deepEqual(JSON.parse(stdout), { ok: false, error: 'rate_limit' });
      const diagnostic = JSON.parse(
        await require('node:fs/promises').readFile(join(directory, 'avalon-last-failure.json'), 'utf8'),
      );
      assert.equal(diagnostic.reason, 'rate_limit');
      assert.equal(diagnostic.rateLimit.kind, kind);
      assert.equal(diagnostic.rateLimit.retryAfterSeconds, retryAfterSeconds);
      if (['tokens', 'requests'].includes(kind)) assert.equal(diagnostic.rateLimit.windowDurationSeconds, 60);
      for (const label of ['limit', 'used', 'requested']) assert.equal(diagnostic.rateLimit[label], amounts?.[label]);
      assert.deepEqual(diagnostic.rateLimit.quota.buckets, [
        {
          limitId: 'codex',
          primary: { usedPercent: 4, windowDurationMins: 300, resetsAt: 1791982189 },
          secondary: { usedPercent: 21, windowDurationMins: 10080, resetsAt: 1792472863 },
          rateLimitReachedType: null,
          spendControlReached: false,
        },
        {
          limitId: 'codex_other',
          primary: { usedPercent: 100, windowDurationMins: 60, resetsAt: 1791982189 },
          secondary: null,
          rateLimitReachedType: kind === 'concurrency' ? 'unknown' : 'workspace_member_usage_limit_reached',
          spendControlReached: true,
        },
      ]);
      assert.equal(diagnostic.rateLimit.quota.status, 'available');
      assert.ok(Date.parse(diagnostic.rateLimit.quota.checkedAt));
      assert.doesNotMatch(JSON.stringify(diagnostic), /PRIVATE_/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

for (const [source, error] of [
  ["console.log(JSON.stringify({type:'turn.completed'}))", 'invalid_response'],
  ["process.stdout.write('x'.repeat(5*1024*1024));setInterval(()=>{},1000)", 'output_limit'],
]) {
  test(`worker reports ${error} without classifying it as a retryable request failure`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-reply-test-'));
    try {
      await writeFile(
        join(directory, 'codex'),
        `#!${process.execPath}\nprocess.stdin.resume();process.stdin.on('end',()=>{${source}});`,
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
      assert.deepEqual(JSON.parse(stdout), { ok: false, error });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

test(
  'quota diagnostic timeout preserves the rate-limit pause and stops app-server descendants',
  { timeout: 5000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-quota-timeout-'));
    let worker;
    let descendant;
    try {
      const source = (await require('node:fs/promises').readFile(join(__dirname, 'worker.cjs'), 'utf8')).replace(
        "finish(Error('timeout')), 15000",
        "finish(Error('timeout')), 300",
      );
      await writeFile(join(directory, 'worker.cjs'), source);
      const pidFile = join(directory, 'descendant');
      await writeFile(
        join(directory, 'codex'),
        `#!${process.execPath}\nif(process.argv[2]==='app-server'){const c=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});require('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(c.pid));setInterval(()=>{},1000);}else{process.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'turn.failed',error:{message:'HTTP 429'}}));setInterval(()=>{},1000)});}`,
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
      assert.equal(result, 0, 'metadata timeout must not retain worker pipes or locks');
      assert.deepEqual(JSON.parse(stdout), { ok: false, error: 'rate_limit' });
      const diagnostic = JSON.parse(
        await require('node:fs/promises').readFile(join(directory, 'avalon-last-failure.json'), 'utf8'),
      );
      assert.equal(diagnostic.rateLimit.quota.status, 'unavailable');
      if (process.platform === 'linux') {
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
  },
);
