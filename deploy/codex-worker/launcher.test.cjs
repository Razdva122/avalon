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
      const second = spawn('bash', [join(directory, 'launch')], { env });
      let output = '';
      second.stdout.on('data', (chunk) => (output += chunk));
      second.stdin.end('{}');
      await new Promise((resolve) => second.on('close', resolve));
      assert.equal(JSON.parse(output).error, 'busy');
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
