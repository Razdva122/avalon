const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

test('entrypoint retains the read-only source and launches nginx with the validated runtime config', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-entrypoint-'));
  try {
    const source = path.join(dir, 'nginx.conf');
    const runtime = path.join(dir, 'avalon-runtime.conf');
    const args = path.join(dir, 'args');
    const validation = path.join(dir, 'validation');
    const original = 'server {\n  location /api/support {\n    proxy_pass http://backend:3000;\n  }\n}\n';
    fs.writeFileSync(source, original, { mode: 0o444 });
    fs.writeFileSync(path.join(dir, 'nginx'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$VALIDATION"\n', { mode: 0o755 });
    const official = path.join(dir, 'official.sh');
    fs.writeFileSync(official, '#!/bin/sh\nprintf "%s\\n" "$@" > "$CAPTURE"\n', { mode: 0o755 });
    const wrapper = fs
      .readFileSync(path.join(__dirname, 'entrypoint.sh'), 'utf8')
      .replaceAll('/etc/nginx/avalon-runtime.conf', runtime)
      .replaceAll('/etc/nginx/nginx.conf', source)
      .replaceAll('/usr/local/share/avalon/board-route.awk', path.join(__dirname, 'board-route.awk'))
      .replaceAll('/docker-entrypoint.sh', official);
    const entrypoint = path.join(dir, 'entrypoint.sh');
    fs.writeFileSync(entrypoint, wrapper);
    const env = { ...process.env, PATH: dir + ':' + process.env.PATH, CAPTURE: args, VALIDATION: validation };
    const result = spawnSync('sh', [entrypoint, 'nginx', '-g', 'daemon off;'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(source, 'utf8'), original);
    assert.match(fs.readFileSync(runtime, 'utf8'), /location \^~ \/api\/player-boards/);
    assert.equal(fs.readFileSync(validation, 'utf8'), `-t\n-c\n${runtime}\n`);
    assert.equal(fs.readFileSync(args, 'utf8'), `nginx\n-c\n${runtime}\n-g\ndaemon off;\n`);
    fs.unlinkSync(validation);
    for (const command of [
      ['nginx', '-c', '/custom.conf', '-t'],
      ['sh', '-c', 'echo diagnostic'],
    ]) {
      assert.equal(spawnSync('sh', [entrypoint, ...command], { env }).status, 0);
      assert.equal(fs.readFileSync(args, 'utf8'), command.join('\n') + '\n');
      assert.equal(fs.existsSync(validation), false);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
