import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
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

test('worker timeouts show the stalled response reason rather than a generic SSH failure', async () => {
  await executable(`process.stdin.resume();process.stdin.on('end',()=>console.log('{"ok":false,"error":"timeout"}'));`);
  await expect(remoteCodex({ operation: 'decide' })).rejects.toThrow('timed out');
});
