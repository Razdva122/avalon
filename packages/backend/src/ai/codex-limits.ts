import { codexEnvironment } from './codex-instances';
import { spawn } from 'child_process';
import type { CodexWeeklyLimit } from '@avalon/types';
import { hasRemoteCodex, remoteCodex, remoteCodexCacheKey } from './codex-remote';

type Window = { usedPercent?: unknown; windowDurationMins?: unknown; resetsAt?: unknown };
type Bucket = { primary?: Window | null; secondary?: Window | null };
export function parseWeeklyLimit(value: unknown, checkedAt = Date.now()): CodexWeeklyLimit | null {
  const response = value as { rateLimits?: Bucket; rateLimitsByLimitId?: Record<string, Bucket> } | null;
  const bucket = response?.rateLimitsByLimitId ? response.rateLimitsByLimitId.codex : response?.rateLimits;
  const week = [bucket?.primary, bucket?.secondary].find((window) => window?.windowDurationMins === 10080);
  if (!week || typeof week.usedPercent !== 'number' || !Number.isFinite(week.usedPercent)) return null;
  const short = [bucket?.primary, bucket?.secondary].find((window) => window?.windowDurationMins === 300);
  const noShortWindow =
    (bucket?.primary === week && bucket?.secondary === null) ||
    (bucket?.secondary === week && bucket?.primary === null);
  const shortTerm =
    short && typeof short.usedPercent === 'number' && Number.isFinite(short.usedPercent)
      ? {
          remainingPercent: Math.max(0, Math.min(100, 100 - short.usedPercent)),
          resetsAt:
            typeof short.resetsAt === 'number' && Number.isFinite(short.resetsAt) && short.resetsAt > 0
              ? short.resetsAt
              : null,
        }
      : undefined;
  return {
    ...(shortTerm ? { shortTerm } : noShortWindow ? { shortTerm: null } : {}),
    remainingPercent: Math.max(0, Math.min(100, 100 - week.usedPercent)),
    resetsAt:
      typeof week.resetsAt === 'number' && Number.isFinite(week.resetsAt) && week.resetsAt > 0 ? week.resetsAt : null,
    checkedAt,
  };
}

// Only initialize and read account quotas: never start a model turn or expose credentials.
async function readCodexLimitResponse(): Promise<unknown> {
  if (hasRemoteCodex()) return remoteCodex({ operation: 'limits' });
  const env: NodeJS.ProcessEnv = {};
  for (const key of [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'TMPDIR',
    'LANG',
    'LC_ALL',
    'CODEX_HOME',
    'SSL_CERT_FILE',
    'CODEX_CA_CERTIFICATE',
    'HTTPS_PROXY',
    'HTTP_PROXY',
    'NO_PROXY',
  ]) {
    if (codexEnvironment()[key]) env[key] = codexEnvironment()[key];
  }
  if (codexEnvironment().AI_CODEX_HOME) env.CODEX_HOME = codexEnvironment().AI_CODEX_HOME;
  return new Promise((resolve, reject) => {
    const child = spawn(
      codexEnvironment().AI_CODEX_BIN || 'codex',
      ['app-server', '--stdio', '-c', 'forced_login_method="chatgpt"'],
      { env, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let done = false;
    let buffer = '';
    const timeout = setTimeout(() => finish(new Error('Codex limits unavailable')), 10000);
    const finish = (error?: Error, value?: unknown) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      child.stdin.end();
      child.kill();
      const force = setTimeout(() => child.kill('SIGKILL'), 1000);
      force.unref();
      child.once('close', () => clearTimeout(force));
      if (error) reject(error);
      else resolve(value ?? null);
    };
    const send = (message: object) => child.stdin.write(JSON.stringify(message) + '\n');
    child.stderr.resume();
    child.stdin.on('error', () => finish(new Error('Codex limits unavailable')));
    child.on('error', () => finish(new Error('Codex limits unavailable')));
    child.on('close', () => {
      if (!done) finish(new Error('Codex limits unavailable'));
    });
    child.stdout.on('data', (chunk: Buffer) => {
      if (done) return;
      buffer += chunk.toString();
      if (buffer.length > 1024 * 1024) return finish(new Error('Codex limits unavailable'));
      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        try {
          const message = JSON.parse(line);
          if (message.id !== 1 && message.id !== 2) continue;
          if (message.error) return finish(new Error('Codex limits unavailable'));
          if (message.id === 1) {
            send({ method: 'initialized', params: {} });
            send({ id: 2, method: 'account/rateLimits/read' });
          } else return finish(undefined, message.result);
        } catch {
          return finish(new Error('Codex limits unavailable'));
        }
      }
    });
    send({
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'avalon_quota_preview', title: 'Avalon quota preview', version: '1.0.0' } },
    });
  });
}

export async function readCodexWeeklyLimit(): Promise<CodexWeeklyLimit | null> {
  return parseWeeklyLimit(await readCodexLimitResponse());
}

const cache = new Map<string, { expires: number; value: CodexWeeklyLimit | null }>();
const pending = new Map<string, Promise<CodexWeeklyLimit | null>>();
export async function getCodexWeeklyLimit(fresh = false): Promise<CodexWeeklyLimit | null> {
  if (fresh) return readCodexWeeklyLimit().catch(() => null);
  const environment = codexEnvironment();
  const key = hasRemoteCodex()
    ? remoteCodexCacheKey()
    : `${environment.AI_CODEX_BIN || 'codex'}:${environment.AI_CODEX_HOME || environment.CODEX_HOME || environment.HOME}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const promise = readCodexWeeklyLimit()
    .catch(() => null)
    .then((value) => {
      if (cache.size >= 64) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + 60000, value });
      return value;
    });
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    if (pending.get(key) === promise) pending.delete(key);
  }
}
