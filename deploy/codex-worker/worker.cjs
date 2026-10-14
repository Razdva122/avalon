'use strict';
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { mkdtemp, writeFile, readFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const TIMEOUT = 10 * 60 * 1000;
const LIMIT = 4 * 1024 * 1024;

function validateRequest(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw Error('invalid');
  if (!['decide', 'models', 'limits'].includes(request.operation)) throw Error('invalid');
  const allowed = request.operation === 'decide' ? ['operation', 'prompt', 'schema', 'settings'] : ['operation'];
  if (Object.keys(request).some((k) => !allowed.includes(k))) throw Error('invalid');
  if (request.operation !== 'decide') return;
  if (typeof request.prompt !== 'string' || !request.prompt || Buffer.byteLength(request.prompt) > 512 * 1024)
    throw Error('invalid');
  if (
    !request.schema ||
    typeof request.schema !== 'object' ||
    Array.isArray(request.schema) ||
    Buffer.byteLength(JSON.stringify(request.schema)) > 64 * 1024
  )
    throw Error('invalid');
  if (request.settings !== undefined) {
    const s = request.settings;
    if (
      !s ||
      typeof s !== 'object' ||
      Object.keys(s).some((k) => !['model', 'reasoning'].includes(k)) ||
      typeof s.model !== 'string' ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(s.model) ||
      !['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(s.reasoning)
    )
      throw Error('invalid');
  }
}

function quota() {
  return new Promise((resolve, reject) => {
    const child = spawn('codex', ['app-server', '--stdio', '-c', 'forced_login_method="chatgpt"'], {
      detached: process.platform !== 'win32',
    });
    let buffer = '',
      done = false;
    const timer = setTimeout(() => finish(Error('timeout')), 15000);
    function finish(error, result) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.stdin.end();
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch {
        /* process already exited */
      }
      if (error) reject(error);
      else resolve(result);
    }
    function send(value) {
      child.stdin.write(JSON.stringify(value) + '\n');
    }
    child.stderr.resume();
    child.stdin.on('error', () => finish(Error('failed')));
    child.on('error', () => finish(Error('failed')));
    child.on('close', () => {
      if (!done) finish(Error('failed'));
    });
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      if (buffer.length > LIMIT) return finish(Error('large'));
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        try {
          const m = JSON.parse(line);
          if (![1, 2].includes(m.id)) continue;
          if (m.error) return finish(Error('failed'));
          if (m.id === 1) {
            send({ method: 'initialized', params: {} });
            send({ id: 2, method: 'account/rateLimits/read' });
          } else return finish(null, m.result);
        } catch {
          return finish(Error('invalid'));
        }
      }
    });
    send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'avalon_worker', version: '1.0.0' } } });
  });
}

function parseRateLimit(text) {
  const details = { kind: 'unknown' };
  if (/concurrent requests|concurrency|simultaneous requests/i.test(text)) details.kind = 'concurrency';
  else if (/tokens? per (?:min|second)|\bTPM\b/i.test(text)) details.kind = 'tokens';
  else if (/requests? per (?:min|second)|\bRPM\b/i.test(text)) details.kind = 'requests';
  if (/(?:tokens?|requests?) per min|\b(?:TPM|RPM)\b/i.test(text)) details.windowDurationSeconds = 60;
  else if (/(?:tokens?|requests?) per second/i.test(text)) details.windowDurationSeconds = 1;
  for (const label of ['limit', 'used', 'requested']) {
    const amount = text.match(new RegExp(`\\b${label}\\s*[:=]?\\s*(\\d+)(?=$|\\s|[,.;](?!\\d))`, 'i'));
    if (amount && Number.isSafeInteger(Number(amount[1]))) details[label] = Number(amount[1]);
  }
  const retry =
    text.match(
      /\b(?:try|retry) (?:again )?(?:in|after)\s+(\d+(?:\.\d+)?)\s*(milliseconds?|ms|minutes?|mins?|seconds?|secs?|s)(?=$|[\s,.;])/i,
    ) || text.match(/\bretry-after\s*[:=]\s*(\d+(?:\.\d+)?)(?=[\t ]*(?:\r?\n|$))/i);
  if (retry) {
    const seconds =
      Number(retry[1]) * (/^(?:milliseconds?|ms)$/i.test(retry[2]) ? 0.001 : /^min/i.test(retry[2]) ? 60 : 1);
    if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 7 * 86400) details.retryAfterSeconds = seconds;
  }
  return details;
}

// Keep only quota metadata, never account identifiers, credentials or CLI messages.
async function quotaDiagnostic() {
  try {
    const result = await quota();
    const entries = Object.entries(result?.rateLimitsByLimitId || {});
    if (!entries.length && result?.rateLimits) entries.push(['codex', result.rateLimits]);
    const window = (value) => {
      if (value === null) return null;
      if (
        !value ||
        !Number.isFinite(value.usedPercent) ||
        value.usedPercent < 0 ||
        value.usedPercent > 100 ||
        !Number.isSafeInteger(value.windowDurationMins) ||
        value.windowDurationMins <= 0 ||
        !Number.isSafeInteger(value.resetsAt) ||
        value.resetsAt <= 0
      )
        return undefined;
      return {
        usedPercent: value.usedPercent,
        windowDurationMins: value.windowDurationMins,
        resetsAt: value.resetsAt,
      };
    };
    const buckets = entries
      .filter(([id, value]) => /^[a-zA-Z0-9_.-]{1,80}$/.test(id) && value && typeof value === 'object')
      .slice(0, 16)
      .map(([limitId, value]) => ({
        limitId,
        primary: window(value.primary),
        secondary: window(value.secondary),
        rateLimitReachedType: [
          'rate_limit_reached',
          'workspace_owner_credits_depleted',
          'workspace_member_credits_depleted',
          'workspace_owner_usage_limit_reached',
          'workspace_member_usage_limit_reached',
        ].includes(value.rateLimitReachedType)
          ? value.rateLimitReachedType
          : value.rateLimitReachedType === null
            ? null
            : 'unknown',
        ...(typeof value.spendControlReached === 'boolean' ? { spendControlReached: value.spendControlReached } : {}),
      }));
    return { checkedAt: new Date().toISOString(), status: buckets.length ? 'available' : 'unavailable', buckets };
  } catch {
    return { checkedAt: new Date().toISOString(), status: 'unavailable' };
  }
}

async function decide(request) {
  const directory = await mkdtemp('/tmp/avalon-game-');
  try {
    const schema = join(directory, 'schema.json'),
      output = join(directory, 'reply.json');
    await writeFile(schema, JSON.stringify(request.schema));
    const args = [
      'exec',
      '--ignore-user-config',
      '--ephemeral',
      '--skip-git-repo-check',
      '--sandbox',
      'read-only',
      '-c',
      'approval_policy="on-request"',
      '-c',
      'forced_login_method="chatgpt"',
      '-c',
      `model_reasoning_effort=${JSON.stringify(request.settings?.reasoning || 'low')}`,
      ...[
        'shell_tool',
        'unified_exec',
        'shell_snapshot',
        'multi_agent',
        'apps',
        'plugins',
        'browser_use',
        'image_generation',
        'hooks',
        'code_mode_host',
        'workspace_dependencies',
        'view_image',
      ].flatMap((k) => ['-c', `features.${k}=false`]),
      '-c',
      'web_search="disabled"',
      '-c',
      'tools.view_image=false',
      ...(request.settings ? ['--model', request.settings.model] : []),
      '-C',
      directory,
      '--json',
      '--output-schema',
      schema,
      '-o',
      output,
      '-',
    ];
    const usage = await new Promise((resolve, reject) => {
      const startedAt = Date.now();
      let lastEvent = 'none',
        transport = 'none',
        diagnosticBuffer = '',
        errorCategory = 'unknown',
        httpStatus;
      const child = spawn('codex', args, { detached: process.platform !== 'win32' });
      const kill = () => {
        try {
          if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
          else child.kill('SIGKILL');
        } catch {
          /* process already exited */
        }
      };
      let buffer = '',
        bytes = 0,
        tokens = {},
        failure = false,
        failureReason = 'failed';
      const timer = setTimeout(() => {
        failure = true;
        failureReason = 'timeout';
        kill();
      }, TIMEOUT);
      const noteDiagnostic = (chunk) => {
        diagnosticBuffer = (diagnosticBuffer + chunk.toString()).slice(-4096);
        if (/stream disconnected|reconnecting|connection.*(?:failed|reset)|timed? out/i.test(diagnosticBuffer))
          transport = 'connection';
        else if (/unauthorized|authentication|401|403/i.test(diagnosticBuffer)) transport = 'authentication';
        const status = diagnosticBuffer.match(
          /(?:HTTP(?:\/\d(?:\.\d)?)?\s+|status(?:\s+code)?\s*[:=]?\s*)([45]\d{2})\b/i,
        );
        if (status) httpStatus = Number(status[1]);
        if (/(?:hit|reached|exceeded) your usage limit|usage_limit_reached/i.test(diagnosticBuffer))
          errorCategory = 'usage_limit';
        else if (/rate.?limit|too many requests/i.test(diagnosticBuffer) || httpStatus === 429)
          errorCategory = 'rate_limit';
        else if (/invalid.*schema|schema.*(?:invalid|unsupported)|response_format/i.test(diagnosticBuffer))
          errorCategory = 'invalid_schema';
        else if (/context.*(?:limit|exceeded|window)|too many tokens/i.test(diagnosticBuffer))
          errorCategory = 'context_limit';
        else if (/model.*(?:not found|not available|not supported|does not exist)/i.test(diagnosticBuffer))
          errorCategory = 'model_unavailable';
        else if (transport !== 'none') errorCategory = transport;
        else if (httpStatus >= 500) errorCategory = 'server_error';
        else if (httpStatus >= 400) errorCategory = 'invalid_request';
      };
      child.stderr.on('data', noteDiagnostic);
      child.stdin.on('error', () => {});
      child.on('error', () => {
        failureReason = 'cli_unavailable';
        failure = true;
      });
      child.stdout.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > LIMIT) {
          failureReason = 'output_limit';
          failure = true;
          kill();
          return;
        }
        buffer += chunk.toString();
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          try {
            const event = JSON.parse(line);
            if (
              [
                'thread.started',
                'turn.started',
                'turn.completed',
                'turn.failed',
                'error',
                'item.started',
                'item.completed',
              ].includes(event.type)
            )
              lastEvent = event.type;
            if (event.type === 'turn.completed') tokens = event.usage || {};
            if (['error', 'turn.failed'].includes(event.type))
              noteDiagnostic(event.error?.message || event.message || '');
            if (['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(event.item?.type)) {
              failureReason = 'forbidden_tool';
              failure = true;
              kill();
            } else if (event.type === 'turn.failed') {
              failure = true;
              kill();
            }
          } catch {
            /* ignore CLI diagnostics */
          }
        }
      });
      child.on('close', async (code) => {
        clearTimeout(timer);
        // A rate limit is a technical pause, never a retryable decision failure.
        if (failureReason === 'failed' && ['rate_limit', 'usage_limit'].includes(errorCategory))
          failureReason = errorCategory;
        if ((failure || code !== 0) && process.env.CODEX_HOME) {
          try {
            const at = new Date().toISOString();
            const elapsedMs = Date.now() - startedAt;
            const rateLimit = ['rate_limit', 'usage_limit'].includes(failureReason)
              ? {
                  ...parseRateLimit(diagnosticBuffer),
                  ...(failureReason === 'usage_limit' ? { kind: 'account_usage' } : {}),
                  quota: await quotaDiagnostic(),
                }
              : undefined;
            await writeFile(
              join(process.env.CODEX_HOME, 'avalon-last-failure.json'),
              JSON.stringify({
                at,
                elapsedMs,
                reason: failureReason,
                lastEvent,
                transport,
                errorCategory,
                httpStatus,
                exitCode: code,
                model: request.settings?.model,
                rateLimit,
              }),
              { mode: 0o600 },
            );
          } catch {
            /* diagnostic storage must not prevent request cleanup */
          }
        }
        if (failure || code !== 0) reject(Error(failureReason));
        else resolve(tokens);
      });
      child.stdin.end(request.prompt);
    });
    const text = await readFile(output, 'utf8');
    if (Buffer.byteLength(text) > LIMIT) throw Error('output_limit');
    return { text, usage };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function handleRequest(request) {
  validateRequest(request);
  if (request.operation === 'decide') return decide(request);
  if (request.operation === 'limits') return quota();
  const { stdout } = await promisify(execFile)('codex', ['debug', 'models'], { timeout: 20000, maxBuffer: LIMIT });
  return JSON.parse(stdout);
}
async function main() {
  process.stdin.setEncoding('utf8');
  let input = '';
  const inputTimer = setTimeout(() => process.exit(1), 15000);
  try {
    for await (const chunk of process.stdin) {
      input += chunk.toString();
      if (Buffer.byteLength(input) > 1024 * 1024) throw Error('large');
    }
    clearTimeout(inputTimer);
    const result = await handleRequest(JSON.parse(input));
    process.stdout.write(JSON.stringify({ ok: true, result }) + '\n');
  } catch (error) {
    clearTimeout(inputTimer);
    process.stdout.write(
      JSON.stringify({
        ok: false,
        error: ['rate_limit', 'usage_limit', 'timeout', 'forbidden_tool', 'output_limit', 'cli_unavailable'].includes(
          error.message,
        )
          ? error.message
          : ['invalid', 'large'].includes(error.message)
            ? 'invalid_request'
            : error.code === 'ENOENT'
              ? 'invalid_response'
              : 'failed',
      }) + '\n',
    );
  }
}
module.exports = { validateRequest, handleRequest };
if (require.main === module) main();
