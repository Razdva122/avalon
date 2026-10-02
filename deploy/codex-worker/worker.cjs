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
    const child = spawn('codex', ['app-server', '--stdio', '-c', 'forced_login_method="chatgpt"']);
    let buffer = '',
      done = false;
    const timer = setTimeout(() => finish(Error('timeout')), 15000);
    function finish(error, result) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.stdin.end();
      child.kill('SIGKILL');
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
      const child = spawn('codex', args);
      let buffer = '',
        bytes = 0,
        tokens = {},
        failure = false,
        failureReason = 'failed';
      const timer = setTimeout(() => {
        failure = true;
        child.kill('SIGKILL');
      }, TIMEOUT);
      child.stderr.resume();
      child.stdin.on('error', () => {});
      child.on('error', () => {
        failure = true;
      });
      child.stdout.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > LIMIT) {
          failure = true;
          child.kill('SIGKILL');
          return;
        }
        buffer += chunk.toString();
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          try {
            const event = JSON.parse(line);
            if (event.type === 'turn.completed') tokens = event.usage || {};
            // Return only a safe category, never raw CLI messages or account details.
            if (
              ['error', 'turn.failed'].includes(event.type) &&
              /(?:hit|reached|exceeded) your usage limit|usage_limit_reached/i.test(
                event.error?.message || event.message || '',
              )
            )
              failureReason = 'usage_limit';
            if (
              event.type === 'turn.failed' ||
              ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(event.item?.type)
            ) {
              failure = true;
              child.kill('SIGKILL');
            }
          } catch {
            /* ignore CLI diagnostics */
          }
        }
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (failure || code !== 0) reject(Error(failureReason));
        else resolve(tokens);
      });
      child.stdin.end(request.prompt);
    });
    const text = await readFile(output, 'utf8');
    if (Buffer.byteLength(text) > LIMIT) throw Error('large');
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
      JSON.stringify({ ok: false, error: error.message === 'usage_limit' ? 'usage_limit' : 'failed' }) + '\n',
    );
  }
}
module.exports = { validateRequest, handleRequest };
if (require.main === module) main();
