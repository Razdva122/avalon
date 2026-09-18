const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

// Exercise the production location/rewrite rules, not an Express SPA fallback.
// Only listeners, TLS and filesystem paths are adapted for an isolated local server.
(async () => {
  const dist = path.resolve(process.env.SEO_DIST_DIR || path.join(__dirname, '../dist'));
  assert(fs.existsSync(path.join(dist, 'index.html')), 'Build/export the UI before checking nginx');
  const nginx =
    process.env.NGINX_BIN || (fs.existsSync('/opt/homebrew/bin/nginx') ? '/opt/homebrew/bin/nginx' : 'nginx');
  const mime = ['/etc/nginx/mime.types', '/opt/homebrew/etc/nginx/mime.types', '/usr/local/etc/nginx/mime.types'].find(
    fs.existsSync,
  );
  assert(mime, 'Install nginx with mime.types before running this check');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-seo-nginx-'));
  const portServer = net.createServer();
  await new Promise((resolve) => portServer.listen(0, '127.0.0.1', resolve));
  const port = portServer.address().port;
  await new Promise((resolve) => portServer.close(resolve));
  const source = fs.readFileSync(path.resolve(__dirname, '../../../nginx.conf'), 'utf8');
  const marker = '  server {\n    listen       443 ssl http2;\n    server_name  avalon-game.com;';
  assert(source.includes(marker), 'Production server block changed: update the test adapter');
  let server = source.slice(source.indexOf(marker)).replace(/\n}\s*$/, '');
  server = server
    .replace('listen       443 ssl http2;', `listen 127.0.0.1:${port};`)
    .replace(/^\s*ssl_.*;\s*$/gm, '')
    .replace('root /app;', `root "${dist}";`);
  const config = path.join(temp, 'nginx.conf');
  fs.writeFileSync(
    config,
    `daemon off;\npid "${temp}/nginx.pid";\nerror_log stderr warn;\nevents {}\nhttp {\ninclude "${mime}";\naccess_log off;\n${server}\n}\n`,
  );
  let child;
  let closed;
  let logs = '';
  try {
    const check = spawnSync(nginx, ['-t', '-p', temp, '-c', config], { encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr || check.error?.message);
    child = spawn(nginx, ['-p', temp, '-c', config], { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', (data) => {
      logs += data;
    });
    closed = new Promise((resolve) => child.once('close', resolve));
    const origin = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        const response = await fetch(origin + '/robots.txt');
        await response.arrayBuffer();
        ready = response.ok;
      } catch {}
      if (ready || child.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(ready, `nginx did not start: ${logs}`);
    const result = spawnSync(process.execPath, [path.join(__dirname, 'check-seo-http.cjs')], {
      env: { ...process.env, SEO_BASE_URL: origin },
      stdio: 'inherit',
      timeout: 120000,
    });
    assert.equal(result.status, 0, 'Production nginx SEO checks failed');
  } finally {
    if (child && child.exitCode === null) child.kill('SIGQUIT');
    if (closed) await closed;
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
