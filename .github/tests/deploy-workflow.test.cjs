const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');
const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../workflows/deploy.yml'), 'utf8'));

test('manual room override reaches SSH, while check-only always prevents deployment', () => {
  const step = workflow.jobs['deploy-to-server'].steps.find(
    (item) => item.name === 'Deploy published images over restricted SSH',
  );
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-deploy-workflow-'));
  try {
    const output = path.join(directory, 'command');
    fs.writeFileSync(
      path.join(directory, 'ssh'),
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const knownHosts = args.find(value => value.startsWith('UserKnownHostsFile='));
fs.writeFileSync(process.env.COMMAND_OUTPUT, JSON.stringify({
  args, knownHosts: fs.readFileSync(knownHosts.slice('UserKnownHostsFile='.length), 'utf8')
}));
`,
      {
        mode: 0o700,
      },
    );
    for (const [skip, check, expected] of [
      ['false', 'false', 'deploy v71.0.0'],
      ['true', 'false', 'deploy-skip-rooms v71.0.0'],
      ['false', 'true', 'check v71.0.0'],
      ['true', 'true', 'check v71.0.0'],
    ]) {
      const result = spawnSync('bash', ['-e', '-c', step.run], {
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          COMMAND_OUTPUT: output,
          DEPLOY_SSH_KEY: 'test-only-placeholder',
          DEPLOY_SSH_HOST: 'worker.example.invalid',
          DEPLOY_SSH_USER: 'deploy-test',
          DEPLOY_SSH_KNOWN_HOSTS: 'worker.example.invalid ssh-ed25519 test-only-public-key',
          RELEASE_TAG: 'v71.0.0',
          SKIP_ROOM_CHECK: skip,
          CHECK_ONLY: check,
        },
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      const resultData = JSON.parse(fs.readFileSync(output, 'utf8'));
      assert.equal(resultData.args.at(-1), expected);
      assert.equal(resultData.args.at(-2), 'deploy-test@worker.example.invalid');
      assert.equal(resultData.knownHosts.trim(), 'worker.example.invalid ssh-ed25519 test-only-public-key');
      assert.ok(resultData.args.includes('StrictHostKeyChecking=yes'));
    }
    for (const missing of ['DEPLOY_SSH_HOST', 'DEPLOY_SSH_USER', 'DEPLOY_SSH_KNOWN_HOSTS']) {
      fs.rmSync(output, { force: true });
      const env = {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        COMMAND_OUTPUT: output,
        DEPLOY_SSH_KEY: 'test-only-placeholder',
        DEPLOY_SSH_HOST: 'worker.example.invalid',
        DEPLOY_SSH_USER: 'deploy-test',
        DEPLOY_SSH_KNOWN_HOSTS: 'test-only-public-key',
        RELEASE_TAG: 'v71.0.0',
        SKIP_ROOM_CHECK: 'false',
        CHECK_ONLY: 'true',
      };
      delete env[missing];
      const result = spawnSync('bash', ['-e', '-c', step.run], { env, encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.equal(fs.existsSync(output), false, 'Missing connection secrets must prevent SSH');
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
