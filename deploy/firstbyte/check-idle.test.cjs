const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

test('the streamed check uses the private backend inventory and fails closed', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-firstbyte-idle-'));
  const preload = path.join(directory, 'fetch-fixture.cjs');
  fs.writeFileSync(
    preload,
    `
    const assert = require('node:assert/strict');
    global.fetch = async (url, options) => {
      assert.equal(url, 'http://127.0.0.1:3000/internal/deploy/rooms');
      assert.equal(options.redirect, 'error');
      assert(options.signal instanceof AbortSignal);
      const fixture = JSON.parse(process.env.IDLE_FIXTURE);
      if (fixture.offline) throw Error('connection refused');
      return new Response(JSON.stringify(fixture.body), { status: fixture.status || 200 });
    };
  `,
  );
  try {
    const source = fs.readFileSync(path.join(__dirname, 'check-idle.cjs'), 'utf8');
    for (const [fixture, expected, activeRooms] of [
      [{ body: { activeRooms: [] } }, 0, []],
      [{ body: { activeRooms: ['old-active-room'] } }, 3, ['old-active-room']],
      [{ body: { activeRooms: Array.from({ length: 21 }, (_, i) => `room-${i}`) } }, 3],
      [{ body: { activeRooms: [] }, status: 404 }, 2],
      [{ body: { activeRooms: null } }, 2],
      [{ body: { activeRooms: [''] } }, 2],
      [{ offline: true }, 2],
    ]) {
      const result = spawnSync(process.execPath, ['--require', preload, '-'], {
        input: source,
        encoding: 'utf8',
        env: { ...process.env, IDLE_FIXTURE: JSON.stringify(fixture) },
        timeout: 3000,
      });
      assert.equal(result.status, expected, result.stderr || result.stdout);
      const decision = JSON.parse(result.stdout);
      assert.equal(decision.exitCode, expected);
      if (activeRooms) assert.deepEqual(decision.activeRooms, activeRooms);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
