import { codexEnvironment } from './codex-instances';
import { execFile } from 'child_process';
import { isAbsolute } from 'path';
import { AiTechnicalPause, CodexRequestFailed, CodexRateLimited } from './client';
import { AI_REQUEST_TIMEOUT_MS, AI_WORKER_QUEUE_TIMEOUT_MS } from './timing';

export function hasRemoteCodex() {
  return Boolean(codexEnvironment().AI_CODEX_SSH_HOST);
}

export function remoteCodexCacheKey() {
  return ['AI_CODEX_SSH_HOST', 'AI_CODEX_SSH_USER', 'AI_CODEX_SSH_PORT', 'AI_CODEX_SSH_KEY', 'AI_CODEX_SSH_KNOWN_HOSTS']
    .map((key) => codexEnvironment()[key] || '')
    .join(':');
}

export function remoteCodex(request: object, signal?: AbortSignal, attempt = 0): Promise<unknown> {
  signal?.throwIfAborted();
  const host = codexEnvironment().AI_CODEX_SSH_HOST || '';
  const user = codexEnvironment().AI_CODEX_SSH_USER || '';
  const key = codexEnvironment().AI_CODEX_SSH_KEY || '';
  const knownHosts = codexEnvironment().AI_CODEX_SSH_KNOWN_HOSTS || '';
  const port = codexEnvironment().AI_CODEX_SSH_PORT || '10022';
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host) ||
    !/^[a-z_][a-z0-9_-]*$/.test(user) ||
    !isAbsolute(key) ||
    !isAbsolute(knownHosts) ||
    !/^\d+$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535
  )
    return Promise.reject(new AiTechnicalPause('Invalid Codex SSH configuration.'));
  const input = JSON.stringify(request);
  if (Buffer.byteLength(input) > 1024 * 1024) return Promise.reject(new AiTechnicalPause('Codex request too large.'));
  return new Promise((resolve, reject) => {
    const child = execFile(
      codexEnvironment().AI_CODEX_SSH_BIN || 'ssh',
      [
        '-F',
        '/dev/null',
        '-T',
        '-i',
        key,
        '-p',
        port,
        '-o',
        'BatchMode=yes',
        '-o',
        'IdentitiesOnly=yes',
        '-o',
        'IdentityAgent=none',
        '-o',
        'PasswordAuthentication=no',
        '-o',
        'KbdInteractiveAuthentication=no',
        '-o',
        'StrictHostKeyChecking=yes',
        '-o',
        `UserKnownHostsFile=${knownHosts}`,
        '-o',
        'GlobalKnownHostsFile=/dev/null',
        '-o',
        'ClearAllForwardings=yes',
        '-o',
        'ConnectTimeout=10',
        '-o',
        'ServerAliveInterval=15',
        '-o',
        'ServerAliveCountMax=2',
        `${user}@${host}`,
        'avalon-codex-v1',
      ],
      {
        timeout: AI_REQUEST_TIMEOUT_MS + AI_WORKER_QUEUE_TIMEOUT_MS + 15000,
        maxBuffer: 4 * 1024 * 1024,
        killSignal: 'SIGKILL',
        signal,
        env: { PATH: process.env.PATH, LANG: 'C.UTF-8' },
      },
      (error, stdout) => {
        if (error)
          return reject(
            signal?.aborted
              ? new AiTechnicalPause('Codex request cancelled.')
              : error.killed
                ? new AiTechnicalPause('Codex SSH request failed.')
                : new CodexRequestFailed('Codex SSH request failed.'),
          );
        try {
          const response = JSON.parse(stdout);
          if (response.ok !== true) {
            // Retry busy metadata reads here; failed decisions get one retry in runCodex.
            if (
              response.error === 'busy' &&
              attempt < 3 &&
              'operation' in request &&
              ['models', 'limits'].includes(String(request.operation))
            ) {
              setTimeout(() => {
                Promise.resolve()
                  .then(() => remoteCodex(request, signal, attempt + 1))
                  .then(resolve, reject);
              }, 1000);
              return;
            }
            const reason =
              response.error === 'busy'
                ? 'Codex worker is busy. Retry the match.'
                : response.error === 'usage_limit'
                  ? 'Codex subscription usage limit reached. Wait for the limit to reset, then retry the match.'
                  : response.error === 'rate_limit'
                    ? 'Codex request was rate limited. Wait a while, then manually retry the match.'
                    : response.error === 'timeout'
                      ? 'Codex response timed out. No action was applied; retry the match.'
                      : 'Codex worker request failed.';
            // A worker timeout applied no action, so it is retried once like a local timed-out attempt.
            return reject(
              response.error === 'failed' || response.error === 'timeout'
                ? new CodexRequestFailed(reason)
                : response.error === 'rate_limit'
                  ? new CodexRateLimited(reason, response.retryAfterSeconds)
                  : new AiTechnicalPause(reason),
            );
          }
          resolve(response.result);
        } catch {
          reject(new AiTechnicalPause('Invalid Codex worker response.'));
        }
      },
    );
    child.stdin?.on('error', () => {});
    child.stdin?.end(input);
  });
}
