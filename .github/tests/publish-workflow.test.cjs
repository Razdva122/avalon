const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');
const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../workflows/publish.yml'), 'utf8'));

test('release validation accepts version tags and rejects branches, empty input and shell payloads', () => {
  const step = workflow.jobs['resolve-release']?.steps.find((step) => step.name === 'Validate release tag');
  assert.ok(step, 'release validation must run before checkout and publication');
  for (const tag of [
    'v68.0.1',
    'v1.2.3-rc.1',
    '',
    'master',
    'refs/heads/master',
    '../v1.2.3',
    'v1.2.3;exit 0',
    'v1.2.3\nmaster',
  ]) {
    const result = spawnSync('bash', ['-e', '-c', step.run], {
      env: { ...process.env, RELEASE_TAG: tag },
      encoding: 'utf8',
    });
    assert.equal(
      result.status === 0,
      ['v68.0.1', 'v1.2.3-rc.1'].includes(tag),
      `${JSON.stringify(tag)}: ${result.stderr}`,
    );
  }
});

test('resolved release outputs preserve the selected tag and the checked-out commit', () => {
  const step = workflow.jobs['resolve-release']?.steps.find((step) => step.id === 'release');
  assert.ok(step);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-release-test-'));
  try {
    const output = path.join(dir, 'output');
    const result = spawnSync('bash', ['-e', '-c', step.run], {
      env: { ...process.env, RELEASE_TAG: 'v68.0.1', GITHUB_OUTPUT: output },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const outputs = Object.fromEntries(
      fs
        .readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split('=')),
    );
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    assert.equal(outputs.tag, 'v68.0.1');
    assert.equal(outputs.sha, head);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
