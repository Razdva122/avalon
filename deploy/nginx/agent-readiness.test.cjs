const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('runtime patch targets the public site and preserves unrelated servers', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../nginx.conf'), 'utf8');
  const result = spawnSync('awk', ['-f', path.join(__dirname, 'agent-readiness.awk')], {
    input: source,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /location = \/ \{[\s\S]*?Vary Accept[\s\S]*?location = \/home\.md/);
  assert.match(result.stdout, /location = \/404\/index\.html \{[\s\S]*?rewrite \^ \/404\.md last/);
  assert.match(result.stdout, /location = \/404\.md \{[\s\S]*?text\/markdown/);
  assert.equal((result.stdout.match(/location = \/home\.md/g) || []).length, 1);
  assert.match(result.stdout, /server_name www\.avalon-game\.com;[\s\S]*?return 301/);
});
