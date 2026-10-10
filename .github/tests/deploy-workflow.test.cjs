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
    fs.writeFileSync(path.join(directory, 'ssh'), '#!/bin/bash\nprintf "%s" "${@: -1}" > "$COMMAND_OUTPUT"\n', {
      mode: 0o700,
    });
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
          RELEASE_TAG: 'v71.0.0',
          SKIP_ROOM_CHECK: skip,
          CHECK_ONLY: check,
        },
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.readFileSync(output, 'utf8'), expected);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
