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

test('local release allows one oversized release, then requires a verified repair', () => {
  const { checkReleasePreflight } = require('../scripts/check-release-preflight.cjs');
  const sha = 'a'.repeat(40);
  const run = {
    id: 123,
    head_sha: 'b'.repeat(40),
    status: 'completed',
    conclusion: 'success',
    html_url: 'https://example.invalid/run/123',
  };
  const status = (state, context = 'avalon/bundle-budget/release-123') => ({
    state,
    context,
    target_url: run.html_url,
    created_at: context === 'avalon/bundle-budget' ? '2026-10-21T12:00:00Z' : '2026-10-21T11:00:00Z',
  });
  function runner({ runs = [run], release = [status('success')], repair = [], dirty = false, offline = false } = {}) {
    const calls = [];
    return {
      calls,
      exec(command, args) {
        calls.push([command, args]);
        if (command === 'git') return args[0] === 'status' ? (dirty ? ' M package.json' : '') : sha;
        if (offline) throw Error('offline');
        const endpoint = args[1];
        if (endpoint.includes('/runs?')) return JSON.stringify({ workflow_runs: runs });
        return JSON.stringify(endpoint.includes(sha) ? repair : release);
      },
    };
  }
  const good = runner();
  assert.doesNotThrow(() => checkReleasePreflight(good.exec));
  assert.ok(!good.calls.some(([, args]) => args[1]?.includes(sha)), 'normal releases do not wait for HEAD CI');
  assert.doesNotThrow(() => checkReleasePreflight(runner({ runs: [] }).exec));
  assert.doesNotThrow(
    () => checkReleasePreflight(runner({ release: [] }).exec),
    'migration from old successful releases',
  );
  assert.throws(() => checkReleasePreflight(runner({ release: [status('failure')] }).exec), /превышение/i);
  assert.doesNotThrow(() =>
    checkReleasePreflight(
      runner({ release: [status('failure')], repair: [status('success', 'avalon/bundle-budget')] }).exec,
    ),
  );
  assert.throws(
    () =>
      checkReleasePreflight(
        runner({
          release: [status('failure')],
          repair: [status('failure', 'avalon/bundle-budget'), status('success', 'avalon/bundle-budget')],
        }).exec,
      ),
    /превышение/i,
  );
  assert.throws(
    () =>
      checkReleasePreflight(
        runner({
          release: [status('failure')],
          repair: [{ ...status('success', 'avalon/bundle-budget'), created_at: '2026-10-21T10:00:00Z' }],
        }).exec,
      ),
    /превышение/i,
  );
  assert.throws(
    () => checkReleasePreflight(runner({ runs: [{ ...run, status: 'in_progress' }], release: [] }).exec),
    /провер/i,
  );
  assert.throws(
    () => checkReleasePreflight(runner({ runs: [{ ...run, conclusion: 'failure' }], release: [] }).exec),
    /провер/i,
  );
  assert.throws(() => checkReleasePreflight(runner({ offline: true }).exec), /GitHub/i);
  assert.throws(() => checkReleasePreflight(runner({ dirty: true }).exec), /Commit/i);
});

test('budget flags are persisted separately from the unprivileged build, never for PRs', () => {
  const workflow = readWorkflow('check-ui.yml');
  const record = workflow.jobs['record-budget'];
  assert.deepEqual(workflow.jobs['check-ui'].permissions, { contents: 'read' });
  assert.equal(record.permissions.statuses, 'write');
  assert.match(record.if, /github.event_name == 'push'/);
  assert.match(record.if, /refs\/heads\/master/);
  assert.match(record.if, /inputs.ref/);
  assert.equal(record.needs, 'check-ui');
  assert.equal(readWorkflow('publish.yml').jobs['check-ui'].permissions.statuses, 'write');
  const script = record.steps[0].with.script;
  assert.match(script, /createCommitStatus/);
  assert.match(script, /avalon\/bundle-budget/);
  assert.match(script, /release-/);
  assert.match(script, /failure/);
});

test('npm version is gated before modifying versions and Docker builds run workflow safeguard tests', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.preversion, 'npm run check:release');
  assert.equal(pkg.scripts['check:release'], 'node .github/scripts/check-release-preflight.cjs');
  assert.match(
    fs.readFileSync(path.join(root, 'ui.Dockerfile'), 'utf8'),
    /node --test \.github\/tests\/\*\.test\.cjs\s*&&\s*AVALON_BUNDLE_BUDGET=report AVALON_BUILD_CONTAINER=1 npm run build:ui/,
  );
});
