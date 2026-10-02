const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile, access, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test(
  'cancel during Docker startup cleans up a late container and releases the lock',
  { skip: process.platform !== 'linux' },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-launch-'));
    try {
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
      await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
      const fake = `#!${process.execPath}\nconst fs=require('node:fs');const root=${JSON.stringify(directory)};if(process.argv[2]==='create'){fs.writeFileSync(root+'/started','1');setTimeout(()=>{fs.writeFileSync(root+'/container','1');console.log('created')},1400);}else if(process.argv[2]==='start'){setInterval(()=>{},1000);}else if(process.argv[2]==='rm'){try{fs.unlinkSync(root+'/container')}catch{}}`;
      await writeFile(join(directory, 'docker'), fake, { mode: 0o700 });
      const env = { ...process.env, PATH: `${directory}:${process.env.PATH}` };
      const first = spawn('bash', [join(directory, 'launch')], { env });
      first.stdin.end('{}');
      const exited = new Promise((resolve) => first.on('close', resolve));
      for (let n = 0; n < 100; n++) {
        try {
          await access(join(directory, 'started'));
          break;
        } catch {
          await delay(20);
        }
      }
      await access(join(directory, 'started'));
      first.kill('SIGTERM');
      await exited;
      await assert.rejects(access(join(directory, 'container')));
      const lock = spawn('flock', ['-n', join(directory, 'worker.lock'), 'true']);
      assert.equal(await new Promise((resolve) => lock.on('close', resolve)), 0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

// Reproduces quota/catalog and game requests reaching the same worker together.
test(
  'a request waits for the occupied worker and runs once after it is released',
  { skip: process.platform !== 'linux' },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-queue-'));
    let queued;
    let holder;
    try {
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
      await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
      await writeFile(
        join(directory, 'docker'),
        `#!${process.execPath}\nconst fs=require('node:fs');const root=${JSON.stringify(directory)};if(process.argv[2]==='create')fs.appendFileSync(root+'/created','1');else if(process.argv[2]==='start'){process.stdin.resume();process.stdin.on('end',()=>console.log(JSON.stringify({ok:true,result:'decision'})));}`,
        { mode: 0o700 },
      );
      holder = spawn('flock', [join(directory, 'worker.lock'), 'sh', '-c', 'echo ready; read release']);
      await new Promise((resolve) => holder.stdout.once('data', resolve));
      queued = spawn('bash', [join(directory, 'launch')], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      });
      let output = '';
      queued.stdout.on('data', (chunk) => (output += chunk));
      queued.stdin.end('{}');
      const exited = new Promise((resolve) => queued.on('close', resolve));
      await delay(1200);
      holder.stdin.end('release\n');
      await exited;
      assert.deepEqual(JSON.parse(output), { ok: true, result: 'decision' });
      assert.equal(await readFile(join(directory, 'created'), 'utf8'), '1');
    } finally {
      holder?.stdin.end();
      queued?.kill('SIGTERM');
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test(
  'an SSH output disconnect cancels a queued request without starting a container',
  { skip: process.platform !== 'linux' },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-queue-cancel-'));
    let queued;
    let holder;
    try {
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
      await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
      await writeFile(
        join(directory, 'docker'),
        `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(join(directory, 'docker-called'))},process.argv[2]);`,
        { mode: 0o700 },
      );
      holder = spawn('flock', [join(directory, 'worker.lock'), 'sh', '-c', 'echo ready; read release']);
      await new Promise((resolve) => holder.stdout.once('data', resolve));
      queued = spawn('bash', [join(directory, 'launch')], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      });
      queued.stdin.end('{}');
      queued.stdout.resume();
      const exited = new Promise((resolve) => queued.on('close', resolve));
      await delay(1200);
      queued.stdout.destroy();
      assert.equal(await exited, 1);
      holder.stdin.end('release\n');
      await delay(300);
      await assert.rejects(access(join(directory, 'docker-called')));
    } finally {
      holder?.stdin.end();
      queued?.kill('SIGTERM');
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test(
  'an occupied worker returns busy after a bounded wait without dispatching',
  { skip: process.platform !== 'linux', timeout: 45000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-queue-timeout-'));
    let queued;
    let holder;
    try {
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
      await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
      await writeFile(
        join(directory, 'docker'),
        `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(join(directory, 'docker-called'))},process.argv[2]);`,
        { mode: 0o700 },
      );
      holder = spawn('flock', [join(directory, 'worker.lock'), 'sh', '-c', 'echo ready; read release']);
      await new Promise((resolve) => holder.stdout.once('data', resolve));
      queued = spawn('bash', [join(directory, 'launch')], {
        env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
      });
      let output = '';
      queued.stdout.on('data', (chunk) => (output += chunk));
      queued.stdin.end('{}');
      assert.equal(await new Promise((resolve) => queued.on('close', resolve)), 0);
      assert.deepEqual(JSON.parse(output), { ok: false, error: 'busy' });
      await assert.rejects(access(join(directory, 'docker-called')));
    } finally {
      holder?.stdin.end();
      queued?.kill('SIGTERM');
      await rm(directory, { recursive: true, force: true });
    }
  },
);
