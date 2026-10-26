const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile, access, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('a launcher forwards one request with bounded container resources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'worker-resources-'));
  try {
    const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
    await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
    // This single-request contract needs no competing locks; Linux tests below exercise real flock.
    await writeFile(join(directory, 'flock'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    await writeFile(
      join(directory, 'docker'),
      `#!${process.execPath}
const fs=require('node:fs');const args=process.argv.slice(2);
if(args[0]==='create')fs.writeFileSync(${JSON.stringify(join(directory, 'created'))},JSON.stringify(args));
if(args[0]==='start'){let input='';process.stdin.on('data',c=>input+=c);process.stdin.on('end',()=>console.log(JSON.stringify({ok:true,result:JSON.parse(input).operation})));}
`,
      { mode: 0o700 },
    );
    const child = spawn('bash', [join(directory, 'launch')], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stdin.end('{"operation":"limits"}');
    assert.equal(await new Promise((resolve) => child.on('close', resolve)), 0);
    assert.deepEqual(JSON.parse(output), { ok: true, result: 'limits' });
    const args = JSON.parse(await readFile(join(directory, 'created'), 'utf8'));
    for (const limit of [
      '--memory=512m',
      '--memory-swap=512m',
      '--cpus=1',
      '--pids-limit=128',
      '--cgroup-parent=avalon-codex.slice',
    ]) {
      assert.ok(args.includes(limit), `Missing Docker limit ${limit}`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test(
  'two slots run together, a third waits, and all containers share the resource slice',
  { skip: process.platform !== 'linux', timeout: 55000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'worker-two-slots-'));
    const children = [];
    try {
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll('/opt/avalon-codex', directory);
      await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
      await writeFile(
        join(directory, 'docker'),
        `#!${process.execPath}
const fs=require('node:fs'); const root=${JSON.stringify(directory)}; const args=process.argv.slice(2);
if(args[0]==='create')fs.appendFileSync(root+'/created',JSON.stringify(args)+String.fromCharCode(10));
if(args[0]==='start'){
 const name=args[args.length-1]; process.stdin.resume();
 const timer=setInterval(()=>{if(fs.existsSync(root+'/release-'+name)){clearInterval(timer);console.log('{"ok":true}');process.exit(0)}},20);
}`,
        { mode: 0o700 },
      );
      const start = () => {
        const child = spawn('bash', [join(directory, 'launch')], {
          env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
        });
        child.stdin.end('{}');
        child.stdout.resume();
        child.stderr.on('data', (chunk) => {
          child.launcherError = (child.launcherError || '') + chunk;
        });
        children.push(child);
        return child;
      };
      const records = async () => {
        try {
          return (await readFile(join(directory, 'created'), 'utf8')).trim().split('\n').map(JSON.parse);
        } catch {
          return [];
        }
      };
      const waitFor = async (count) => {
        for (let n = 0; n < 100; n++) {
          if ((await records()).length === count) return;
          await delay(30);
        }
        assert.equal(
          (await records()).length,
          count,
          children.map((c) => `${c.pid}: ${c.exitCode} ${c.launcherError || ''}`).join('\n'),
        );
      };
      start();
      start();
      await waitFor(2);
      const third = start();
      await delay(400);
      const fourth = start();
      await delay(400);
      assert.equal((await records()).length, 2);
      for (const args of await records()) {
        assert.ok(args.includes('--cgroup-parent=avalon-codex.slice'));
        assert.ok(args.includes('--pids-limit=128'));
        assert.ok(args.includes('--memory=512m'));
        assert.ok(args.includes('--memory-swap=512m'));
        assert.ok(args.includes('--cpus=1'));
      }
      // A slow decision must not make another game's queued request fail at 30 seconds.
      await delay(31000);
      assert.equal(third.exitCode, null);
      assert.equal(fourth.exitCode, null);
      assert.equal((await records()).length, 2);
      const first = (await records())[0];
      await writeFile(join(directory, 'release-' + first[first.indexOf('--name') + 1]), '1');
      await waitFor(3);
      const thirdRecord = (await records())[2];
      assert.equal(thirdRecord[thirdRecord.indexOf('--name') + 1], 'avalon-codex-worker-' + third.pid);
      await writeFile(join(directory, 'release-' + thirdRecord[thirdRecord.indexOf('--name') + 1]), '1');
      await waitFor(4);
      const fourthRecord = (await records())[3];
      assert.equal(fourthRecord[fourthRecord.indexOf('--name') + 1], 'avalon-codex-worker-' + fourth.pid);
    } finally {
      const exits = children.map((child) =>
        child.exitCode !== null ? Promise.resolve() : new Promise((resolve) => child.once('close', resolve)),
      );
      children.forEach((child) => child.kill('SIGTERM'));
      await Promise.all(exits);
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test(
  'cancel during Docker startup cleans up a late container and releases the lock',
  { skip: process.platform !== 'linux', timeout: 15000 },
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
  { skip: process.platform !== 'linux', timeout: 15000 },
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

for (const lockFile of ['worker.lock', 'worker-queue.lock'])
  test(
    `an SSH output disconnect cancels a request waiting for ${lockFile} without starting a container`,
    { skip: process.platform !== 'linux', timeout: 15000 },
    async () => {
      const directory = await mkdtemp(join(tmpdir(), 'worker-queue-cancel-'));
      let queued;
      let holder;
      try {
        const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8')).replaceAll(
          '/opt/avalon-codex',
          directory,
        );
        await writeFile(join(directory, 'launch'), script, { mode: 0o700 });
        await writeFile(
          join(directory, 'docker'),
          `#!${process.execPath}\nrequire('node:fs').appendFileSync(${JSON.stringify(join(directory, 'docker-called'))},process.argv[2]);`,
          { mode: 0o700 },
        );
        holder = spawn('flock', [join(directory, lockFile), 'sh', '-c', 'echo ready; read release']);
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
      const script = (await readFile(join(__dirname, 'launch.sh'), 'utf8'))
        .replaceAll('/opt/avalon-codex', directory)
        .replace(/deadline=\$\(\(SECONDS \+ \d+\)\)/, 'deadline=$((SECONDS + 2))');
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
