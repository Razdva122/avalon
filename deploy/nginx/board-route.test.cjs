const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const transform = path.join(__dirname, 'board-route.awk');
const fixture = `events {}
http {
  server {
    listen 18080;
    server_name avalon-game.com;
    location / { return 404; }
    location ^~ /api/support {
      proxy_pass http://127.0.0.1:3000;
      proxy_read_timeout 60s;
    }
  }
  server {
    listen 18081;
    server_name voice.avalon-game.com;
    location /rtc { proxy_pass http://127.0.0.1:7882; }
    location / { return 404; }
  }
}
`;
function run(input) {
  return spawnSync('awk', ['-f', transform], { input, encoding: 'utf8' });
}
test('mounted legacy config gets the board API in the app server, preserving voice and support', () => {
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /location \^~ \/api\/player-boards/);
  assert.equal(
    result.stdout.replace(
      /    # Avalon board API compatibility route\n    location \^~ \/api\/player-boards \{[\s\S]*?\n    \}\n/,
      '',
    ),
    fixture,
  );
  assert.match(result.stdout, /proxy_pass http:\/\/127\.0\.0\.1:3000;/);
  assert.equal(run(result.stdout).stdout, result.stdout, 'no duplicate route on restart');
});
test('current project config remains byte-for-byte unchanged', () => {
  const config = fs.readFileSync(path.resolve(__dirname, '../../nginx.conf'), 'utf8');
  const result = run(config);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, config);
});
test('ambiguous or missing support anchor fails instead of modifying an unknown server', () => {
  for (const config of [fixture.replace('/api/support', '/unknown'), fixture + fixture]) {
    const result = run(config);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
  }
});
test('generated config is accepted by nginx', (t) => {
  if (spawnSync('nginx', ['-v']).error) return t.skip('nginx binary is not installed');
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-nginx-'));
  try {
    fs.mkdirSync(path.join(dir, 'logs'));
    const file = path.join(dir, 'nginx.conf');
    fs.writeFileSync(
      file,
      `pid ${dir}/nginx.pid;\nerror_log stderr;\n` + result.stdout.replace('http {', 'http { access_log off;'),
    );
    const checked = spawnSync('nginx', ['-t', '-e', 'stderr', '-p', dir + '/', '-c', file], { encoding: 'utf8' });
    assert.equal(checked.status, 0, checked.stderr);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('variable upstream is preserved and commented routes do not suppress the upgrade', () => {
  const config =
    '# location ^~ /api/player-boards {\n' + fixture.replace('http://127.0.0.1:3000;', 'http://$avalon_backend;');
  const result = run(config);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/proxy_pass http:\/\/\$avalon_backend;/g).length, 2);
});
test('HTTP requests reach the board upstream, while support and voice keep working', async (t) => {
  if (spawnSync('nginx', ['-v']).error) return t.skip('nginx binary is not installed');
  const http = require('node:http');
  const { spawn } = require('node:child_process');
  const upstream = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ path: req.url }));
  });
  await new Promise((resolve, reject) => {
    upstream.once('error', reject);
    upstream.listen(0, '127.0.0.1', resolve);
  });
  const port = upstream.address().port;
  const reservation = http.createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const frontPort = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-proxy-'));
  let nginx;
  try {
    fs.mkdirSync(path.join(dir, 'logs'));
    const config = fixture
      .replaceAll('listen 18080;', `listen 127.0.0.1:${frontPort};`)
      .replaceAll('listen 18081;', `listen 127.0.0.1:${frontPort};`)
      .replaceAll(':3000;', `:${port};`)
      .replaceAll(':7882;', `:${port};`);
    const result = run(config);
    assert.equal(result.status, 0, result.stderr);
    const file = path.join(dir, 'nginx.conf');
    fs.writeFileSync(
      file,
      `pid ${dir}/nginx.pid;\nerror_log stderr;\n` + result.stdout.replace('http {', 'http { access_log off;'),
    );
    nginx = spawn('nginx', ['-e', 'stderr', '-p', dir + '/', '-c', file, '-g', 'daemon off;'], { stdio: 'pipe' });
    let errors = '';
    nginx.stderr.on('data', (data) => {
      errors += data;
    });
    const request = (url, host = 'avalon-game.com') =>
      new Promise((resolve, reject) => {
        http
          .get({ hostname: '127.0.0.1', port: frontPort, path: url, headers: { Host: host } }, (res) => {
            let body = '';
            res.on('data', (data) => {
              body += data;
            });
            res.on('end', () => resolve({ status: res.statusCode, body }));
          })
          .on('error', reject);
      });
    let ready = false;
    for (let i = 0; i < 50; i++) {
      if (nginx.exitCode !== null) throw Error(errors);
      try {
        await request('/');
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    }
    assert.ok(ready, errors);
    for (const url of ['/api/player-boards?kind=solo&page=1', '/api/player-boards/me', '/api/support/config']) {
      const response = await request(url);
      assert.equal(response.status, 200);
      assert.equal(JSON.parse(response.body).path, url);
    }
    const voice = await request('/rtc', 'voice.avalon-game.com');
    assert.equal(voice.status, 200);
    assert.equal(JSON.parse(voice.body).path, '/rtc');
    assert.equal((await request('/api/player-boards', 'voice.avalon-game.com')).status, 404);
  } finally {
    if (nginx && nginx.exitCode === null) {
      const exited = new Promise((resolve) => nginx.once('exit', resolve));
      nginx.kill('SIGQUIT');
      await exited;
    }
    await new Promise((resolve) => upstream.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
