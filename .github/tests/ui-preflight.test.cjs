const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const readWorkflow = (name) => yaml.load(fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8'));

test('UI preflight runs before release tags, uses the release Dockerfile and publishes no containers', () => {
  const check = readWorkflow('check-ui.yml');
  assert.ok('pull_request' in check.on);
  assert.deepEqual(check.on.push.branches, ['master']);
  assert.ok('workflow_call' in check.on);
  assert.ok('workflow_dispatch' in check.on);
  assert.deepEqual(check.permissions, { contents: 'read' });
  const steps = check.jobs['check-ui'].steps;
  const build = steps.find((step) => step.uses?.startsWith('docker/build-push-action@'));
  assert.equal(build.with.file, 'ui.Dockerfile');
  assert.equal(build.with.target, 'release-artifact');
  assert.equal(build.with.platforms, 'linux/amd64');
  assert.notEqual(build.with.push, true);
  assert.equal(build['continue-on-error'], undefined);
  assert.ok(steps.some((step) => step.run?.includes('check-seo-nginx.cjs')));
  assert.ok(!steps.some((step) => step.uses?.startsWith('docker/login-action@')));
  assert.equal(check.jobs['check-ui']['continue-on-error'], undefined);
});

test('both release containers wait for UI validation and UI packaging consumes its exact artifact', () => {
  const publish = readWorkflow('publish.yml');
  const check = readWorkflow('check-ui.yml');
  assert.equal(publish.jobs['check-ui'].uses, './.github/workflows/check-ui.yml');
  assert.equal(publish.jobs['check-ui'].with.ref, '${{ needs.resolve-release.outputs.sha }}');
  assert.ok(publish.jobs['publish-backend'].needs.includes('check-ui'));
  assert.ok(publish.jobs['publish-ui'].needs.includes('check-ui'));
  const upload = check.jobs['check-ui'].steps.find((step) => step.uses?.startsWith('actions/upload-artifact@'));
  const download = publish.jobs['publish-ui'].steps.find((step) => step.uses?.startsWith('actions/download-artifact@'));
  assert.equal(upload.with.path, 'ui-release/');
  assert.equal(upload.with['if-no-files-found'], 'error');
  assert.equal(download.with.name, '${{ needs.check-ui.outputs.artifact-name }}');
  assert.equal(download.with.path, 'ui-release');
  const builds = publish.jobs['publish-ui'].steps.filter((step) => step.uses?.startsWith('docker/build-push-action@'));
  assert.equal(builds.length, 1, 'publish must not rebuild the verified UI');
  assert.equal(builds[0].with.file, 'ui-release.Dockerfile');
  assert.equal(builds[0].with.push, true);
  assert.ok(check.on.workflow_call.outputs['artifact-name']);
});

test('local release gate requires a clean tree and successful master preflight for the exact HEAD', () => {
  const { checkReleasePreflight } = require('../scripts/check-release-preflight.cjs');
  const sha = 'a'.repeat(40);
  const success = { status: 'completed', conclusion: 'success', headSha: sha, url: 'https://example.invalid/run/123' };
  function runner({ dirty = false, runs = [success], error = false } = {}) {
    const calls = [];
    return {
      calls,
      exec(command, args) {
        calls.push([command, args]);
        if (command === 'git') return args[0] === 'status' ? (dirty ? ' M package.json\n' : '') : `${sha}\n`;
        assert.equal(command, 'gh');
        assert.ok(args.includes('check-ui.yml'));
        assert.ok(args.includes(sha));
        assert.ok(args.includes('master'));
        if (error) throw Error('offline');
        return JSON.stringify(runs);
      },
    };
  }
  const good = runner();
  assert.equal(checkReleasePreflight(good.exec).url, success.url);
  for (const runs of [
    [],
    [{ ...success, headSha: 'b'.repeat(40) }],
    [{ ...success, conclusion: 'failure' }],
    [{ ...success, status: 'in_progress', conclusion: '' }],
    [{ ...success, conclusion: 'cancelled' }],
  ]) {
    assert.throws(() => checkReleasePreflight(runner({ runs }).exec), /preflight/i);
  }
  const dirty = runner({ dirty: true });
  assert.throws(() => checkReleasePreflight(dirty.exec), /commit/i);
  assert.ok(!dirty.calls.some(([command]) => command === 'gh'));
  assert.throws(() => checkReleasePreflight(runner({ error: true }).exec), /GitHub/i);
});

test('npm version is gated before modifying versions and Docker builds run workflow safeguard tests', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.preversion, 'npm run check:release');
  assert.equal(pkg.scripts['check:release'], 'node .github/scripts/check-release-preflight.cjs');
  assert.match(
    fs.readFileSync(path.join(root, 'ui.Dockerfile'), 'utf8'),
    /node --test \.github\/tests\/\*\.test\.cjs\s*&&\s*AVALON_BUILD_CONTAINER=1 npm run build:ui/,
  );
});
