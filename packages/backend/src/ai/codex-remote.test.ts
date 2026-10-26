import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import timers from 'timers/promises';
import { remoteCodex } from './codex-remote';
import { runCodex, codexSchema } from './codex';
import { getCodexModels } from './codex-models';
import { readCodexWeeklyLimit } from './codex-limits';

const previous = { ...process.env };
let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'codex-ssh-test-'));
  process.env.AI_CODEX_SSH_HOST = 'worker.example';
  process.env.AI_CODEX_SSH_USER = 'avalon-codex';
  process.env.AI_CODEX_SSH_PORT = '10022';
  process.env.AI_CODEX_SSH_KEY = '/secrets/key';
  process.env.AI_CODEX_SSH_KNOWN_HOSTS = '/secrets/known_hosts';
  process.env.AI_CODEX_SSH_BIN = join(directory, 'ssh');
});
afterEach(async () => {
  jest.restoreAllMocks();
  process.env = { ...previous };
  await rm(directory, { recursive: true, force: true });
});
async function executable(source: string) {
  await writeFile(process.env.AI_CODEX_SSH_BIN!, `#!${process.execPath}\n${source}`, { mode: 0o700 });
}
test('SSH transport pins host identity and passes JSON input without backend credentials', async () => {
  process.env.UNRELATED_SERVICE_SECRET = 'secret';
  await executable(
    `let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>console.log(JSON.stringify({ok:true,result:{request:JSON.parse(input),args:process.argv.slice(2),secret:process.env.UNRELATED_SERVICE_SECRET||null}})));`,
  );
  const result = (await remoteCodex({ operation: 'models' })) as {
    request: object;
    args: string[];
    secret: string | null;
  };
  expect(result.request).toEqual({ operation: 'models' });
  expect(result.secret).toBeNull();
  expect(result.args).toContain('StrictHostKeyChecking=yes');
  expect(result.args).toContain('UserKnownHostsFile=/secrets/known_hosts');
  expect(result.args).toContain('BatchMode=yes');
  expect(result.args.slice(-2)).toEqual(['avalon-codex@worker.example', 'avalon-codex-v1']);
});
test('worker errors and invalid JSON fail instead of returning a game decision', async () => {
  await executable(`process.stdin.resume();process.stdin.on('end',()=>console.log('{"ok":false,"error":"busy"}'));`);
  await expect(remoteCodex({ operation: 'decide' })).rejects.toThrow('busy');
  await executable(`process.stdin.resume();process.stdin.on('end',()=>console.log('not json'));`);
  await expect(remoteCodex({ operation: 'models' })).rejects.toThrow();
});
test('missing credentials and option-shaped host cannot start the SSH executable', async () => {
  delete process.env.AI_CODEX_SSH_KEY;
  await expect(remoteCodex({ operation: 'models' })).rejects.toThrow('configuration');
  process.env.AI_CODEX_SSH_KEY = '/secrets/key';
  process.env.AI_CODEX_SSH_HOST = '-oProxyCommand=evil';
  await expect(remoteCodex({ operation: 'models' })).rejects.toThrow('configuration');
});

test('busy metadata reads retry but game decisions are never duplicated', async () => {
  const counter = join(directory, 'counter');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('node:fs');const path=${JSON.stringify(counter)};process.stdin.resume();process.stdin.on('end',()=>{const n=Number(fs.readFileSync(path))+1;fs.writeFileSync(path,String(n));console.log(JSON.stringify(n===1?{ok:false,error:'busy'}:{ok:true,result:'ready'}))});`,
  );
  expect(await remoteCodex({ operation: 'models' })).toBe('ready');
  expect(await readFile(counter, 'utf8')).toBe('2');
  await writeFile(counter, '0');
  await expect(remoteCodex({ operation: 'decide' })).rejects.toThrow('busy');
  expect(await readFile(counter, 'utf8')).toBe('1');
});
test('cancellation terminates a pending remote request', async () => {
  await executable(`process.stdin.resume();setInterval(()=>{},1000);`);
  const controller = new AbortController();
  const result = remoteCodex({ operation: 'models' }, controller.signal);
  setTimeout(() => controller.abort(), 30);
  await expect(result).rejects.toThrow();
});

test('game decisions, model catalog and weekly quota use the remote worker when configured', async () => {
  process.env.AI_CODEX_SSH_HOST = 'integration.example';
  await executable(
    `let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{const r=JSON.parse(input);let result;if(r.operation==='decide')result={text:JSON.stringify({choice:r.schema.properties.choice.enum[0],speech:r.settings.model}),usage:{input_tokens:42}};else if(r.operation==='models')result={models:[{slug:'gpt-6.1-sol',display_name:'Sol',visibility:'list',supported_reasoning_levels:[{effort:'low'}]}]};else result={rateLimits:{secondary:{usedPercent:25,windowDurationMins:10080,resetsAt:2000000000}}};console.log(JSON.stringify({ok:true,result}));});`,
  );
  const decision = await runCodex('game', codexSchema(['approve'], false), undefined, {
    model: 'gpt-6.1-sol',
    reasoning: 'low',
  });
  expect(JSON.parse(decision.text)).toEqual({ choice: 'approve', speech: 'gpt-6.1-sol' });
  expect(decision.usage.input_tokens).toBe(42);
  expect(await getCodexModels()).toEqual([{ id: 'gpt-6.1-sol', label: 'Sol', efforts: ['low'] }]);
  expect(await readCodexWeeklyLimit()).toMatchObject({ remainingPercent: 75, resetsAt: 2000000000 });
});

test('exhausted subscription quota gives an actionable pause reason', async () => {
  await executable(
    `process.stdin.resume();process.stdin.on('end',()=>console.log('{"ok":false,"error":"usage_limit"}'));`,
  );
  await expect(remoteCodex({ operation: 'decide' })).rejects.toThrow('subscription usage limit');
});

test.each([false, true])(
  'rate-limited decisions use bounded exponential backoff (alwaysLimited=%s)',
  async (alwaysLimited) => {
    const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
    const counter = join(directory, 'decision-attempts');
    await writeFile(counter, '0');
    await executable(
      `const fs=require('node:fs');const path=${JSON.stringify(counter)};process.stdin.resume();process.stdin.on('end',()=>{const n=Number(fs.readFileSync(path))+1;fs.writeFileSync(path,String(n));console.log(JSON.stringify(n===1||${alwaysLimited}?{ok:false,error:'rate_limit'}:{ok:true,result:{text:'recovered',usage:{input_tokens:7}}}))});`,
    );
    const result = runCodex('game', codexSchema(['approve'], false));
    if (alwaysLimited) await expect(result).rejects.toMatchObject({ codexAttempts: 4 });
    else await expect(result).resolves.toMatchObject({ text: 'recovered', attempts: 2, unknownUsageAttempts: 1 });
    expect(delay).toHaveBeenCalledTimes(alwaysLimited ? 3 : 1);
    delay.mock.calls.forEach(([ms], i) => {
      expect(ms).toBeGreaterThanOrEqual(10000 * 2 ** i);
      expect(ms).toBeLessThanOrEqual(10000 * 2 ** i + 1000);
    });
    expect(await readFile(counter, 'utf8')).toBe(alwaysLimited ? '4' : '2');
  },
);

test('Stop cancels the rate-limit wait without sending another decision', async () => {
  const delay = jest.spyOn(timers, 'setTimeout');
  const counter = join(directory, 'decision-attempts');
  await executable(
    `const fs=require('node:fs');process.stdin.resume();process.stdin.on('end',()=>{fs.appendFileSync(${JSON.stringify(counter)},'1');console.log(JSON.stringify({ok:false,error:'rate_limit'}))});`,
  );
  const controller = new AbortController();
  const outcome = runCodex('game', codexSchema(['approve'], false), controller.signal).catch((error) => error);
  for (let i = 0; i < 100 && !delay.mock.calls.length; i++) await new Promise((resolve) => setTimeout(resolve, 5));
  const waiting = delay.mock.calls.length;
  controller.abort();
  expect(waiting).toBe(1);
  expect(await outcome).toMatchObject({ name: 'AbortError' });
  expect(await readFile(counter, 'utf8')).toBe('1');
});

test('worker timeouts show the stalled response reason rather than a generic SSH failure', async () => {
  await executable(`process.stdin.resume();process.stdin.on('end',()=>console.log('{"ok":false,"error":"timeout"}'));`);
  await expect(remoteCodex({ operation: 'decide' })).rejects.toThrow('timed out');
});

test.each([false, true])('decision request failure retries exactly once (alwaysFails=%s)', async (alwaysFails) => {
  const counter = join(directory, 'decision-attempts');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('node:fs');const path=${JSON.stringify(counter)};let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{const n=Number(fs.readFileSync(path))+1;fs.writeFileSync(path,String(n));console.log(JSON.stringify(n===1||${alwaysFails}?{ok:false,error:'failed'}:{ok:true,result:{text:'{"choice":"approve","speech":"recovered"}',usage:{input_tokens:7}}}))});`,
  );
  const result = runCodex('game', codexSchema(['approve'], false));
  if (alwaysFails) await expect(result).rejects.toThrow('request failed');
  else expect(JSON.parse((await result).text).speech).toBe('recovered');
  expect(await readFile(counter, 'utf8')).toBe('2');
});

test.each([
  'busy',
  'usage_limit',
  'timeout',
  'forbidden_tool',
  'output_limit',
  'cli_unavailable',
  'invalid_request',
  'invalid_response',
])('decision %s does not trigger automatic retry', async (error) => {
  const counter = join(directory, 'decision-attempts');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('node:fs');const path=${JSON.stringify(counter)};process.stdin.resume();process.stdin.on('end',()=>{fs.writeFileSync(path,String(Number(fs.readFileSync(path))+1));console.log(JSON.stringify({ok:false,error:${JSON.stringify(error)}}))});`,
  );
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toThrow();
  expect(await readFile(counter, 'utf8')).toBe('1');
});

test('SSH request failure also gets exactly one retry', async () => {
  const counter = join(directory, 'decision-attempts');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('node:fs');const path=${JSON.stringify(counter)};process.stdin.resume();process.stdin.on('end',()=>{const n=Number(fs.readFileSync(path))+1;fs.writeFileSync(path,String(n));if(n===1)process.exit(1);console.log(JSON.stringify({ok:true,result:{text:'{"choice":"approve","speech":"recovered"}',usage:{}}}))});`,
  );
  expect(JSON.parse((await runCodex('game', codexSchema(['approve'], false))).text).speech).toBe('recovered');
  expect(await readFile(counter, 'utf8')).toBe('2');
});

test('parallel instance quotas, catalogs and independent decisions route to their own workers', async () => {
  const { configuredCodexInstances, withCodexInstance } = await import('./codex-instances');
  const { getCodexWeeklyLimit } = await import('./codex-limits');
  process.env.AI_CODEX_INSTANCES = JSON.stringify(
    ['one', 'two'].map((id) => ({
      id,
      ssh: {
        host: `${id}.pool.example`,
        user: 'avalon-codex',
        key: '/secrets/key',
        knownHosts: '/secrets/known_hosts',
      },
    })),
  );
  const calls = join(directory, 'calls');
  await executable(`
    const fs=require('node:fs');const host=process.argv.at(-2);let input='';
    process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{
      const r=JSON.parse(input);fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify({host,request:r})+'\\n');
      const first=host.includes('one.pool');
      let result;
      if(r.operation==='models') result={models:[{slug:first?'model-one':'model-two',visibility:'list',supported_reasoning_levels:[{effort:'low'}]}]};
      else if(r.operation==='limits')result={rateLimits:{primary:{usedPercent:first?10:30,windowDurationMins:300},secondary:{usedPercent:first?20:40,windowDurationMins:10080}}};
      else result={text:host,usage:{input_tokens:1}};
      setTimeout(()=>console.log(JSON.stringify({ok:true,result})),first?15:1);
    });
  `);
  const instances = configuredCodexInstances();
  const results = await Promise.all(
    instances.map((instance) =>
      withCodexInstance(instance, async () => {
        const [models, quota] = await Promise.all([getCodexModels(), getCodexWeeklyLimit()]);
        const first = await runCodex('game', codexSchema(['approve'], false));
        await runCodex('game two', codexSchema(['approve'], false));
        return { model: models[0].id, remaining: quota?.remainingPercent, decision: first.text };
      }),
    ),
  );
  expect(results).toEqual([
    { model: 'model-one', remaining: 80, decision: 'avalon-codex@one.pool.example' },
    { model: 'model-two', remaining: 60, decision: 'avalon-codex@two.pool.example' },
  ]);
  const requests = (await readFile(calls, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  for (const host of ['one.pool.example', 'two.pool.example']) {
    const own = requests.filter((r) => r.host.endsWith(host)).map((r) => r.request);
    const decisions = own.filter((r) => r.operation === 'decide');
    expect(decisions).toHaveLength(2);
    expect(own.map((r) => r.operation).sort()).toEqual(['decide', 'decide', 'limits', 'models']);
  }
  expect(process.env.AI_CODEX_SSH_HOST).toBe('worker.example');
});

test.each([37, 3600, -1, '37'])('remote Retry-After %s is validated and respected', async (seconds) => {
  const delay = jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
  const counter = join(directory, 'retry-after');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('fs');let n=Number(fs.readFileSync(${JSON.stringify(counter)}));process.stdin.resume();process.stdin.on('end',()=>{fs.writeFileSync(${JSON.stringify(counter)},String(++n));console.log(JSON.stringify(n===1?{ok:false,error:'rate_limit',retryAfterSeconds:${JSON.stringify(seconds)}}:{ok:true,result:{text:'ok',usage:{}}}));});`,
  );
  const result = runCodex('game', codexSchema(['approve'], false));
  if (seconds === 3600) {
    await expect(result).rejects.toMatchObject({ codexAttempts: 1 });
    expect(delay).not.toHaveBeenCalled();
    expect(await readFile(counter, 'utf8')).toBe('1');
  } else {
    await expect(result).resolves.toMatchObject({ attempts: 2 });
    const ms = delay.mock.calls[0][0] as number;
    expect(ms).toBeGreaterThanOrEqual(seconds === 37 ? 37000 : 10000);
    expect(ms).toBeLessThanOrEqual(seconds === 37 ? 38000 : 11000);
  }
});

test('slow rate-limit failures cannot extend the retry budget', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  const delay = jest.spyOn(timers, 'setTimeout').mockImplementation(async () => {
    now.mockReturnValue(85000);
  });
  await executable(
    `process.stdin.resume();process.stdin.on('end',()=>console.log(JSON.stringify({ok:false,error:'rate_limit'})));`,
  );
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toMatchObject({ codexAttempts: 2 });
  expect(delay).toHaveBeenCalledTimes(1);
});

test('generic failure after rate-limit recovery pauses without extending the lease with another long attempt', async () => {
  jest.spyOn(timers, 'setTimeout').mockResolvedValue(undefined);
  const counter = join(directory, 'mixed-attempts');
  await writeFile(counter, '0');
  await executable(
    `const fs=require('fs');process.stdin.resume();process.stdin.on('end',()=>{const n=Number(fs.readFileSync(${JSON.stringify(counter)}))+1;fs.writeFileSync(${JSON.stringify(counter)},String(n));console.log(JSON.stringify({ok:false,error:n===1?'rate_limit':'failed'}));});`,
  );
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toMatchObject({ codexAttempts: 2 });
  expect(await readFile(counter, 'utf8')).toBe('2');
});

test('an overslept rate-limit timer cannot dispatch after the recovery deadline', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  const delay = jest.spyOn(timers, 'setTimeout').mockImplementation(async () => {
    now.mockReturnValue(91000);
  });
  const counter = join(directory, 'overslept');
  await executable(
    `const fs=require('fs');process.stdin.resume();process.stdin.on('end',()=>{fs.appendFileSync(${JSON.stringify(counter)},'1');console.log(JSON.stringify({ok:false,error:'rate_limit'}));});`,
  );
  await expect(runCodex('game', codexSchema(['approve'], false))).rejects.toMatchObject({ codexAttempts: 1 });
  expect(delay).toHaveBeenCalledTimes(1);
  expect(await readFile(counter, 'utf8')).toBe('1');
});
