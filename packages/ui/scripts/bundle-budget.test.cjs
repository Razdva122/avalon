const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { bundleBudget } = require('./bundle-budget.cjs');

test('budget violations are recorded, strict locally and report-only when explicitly requested', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-budget-'));
  try {
    const report = path.join(directory, 'bundle-budget.json');
    const strict = bundleBudget(report, false);
    strict.check(10, 10, 'equal limit');
    strict.check(11, 10, 'above limit');
    assert.throws(() => strict.finish(), /2 bundle budget/);
    assert.equal(JSON.parse(fs.readFileSync(report)).violations.length, 2);
    const soft = bundleBudget(report, true);
    soft.check(11, 10, 'above limit');
    assert.doesNotThrow(() => soft.finish());
    assert.equal(JSON.parse(fs.readFileSync(report)).violations[0].bytes, 11);
    const repaired = bundleBudget(report, true);
    repaired.check(9, 10, 'within budget');
    repaired.finish();
    assert.deepEqual(JSON.parse(fs.readFileSync(report)), { violations: [] });
    assert.throws(() => repaired.check(NaN, 10, 'invalid measurement'), /measurement/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('real bundle audit permits only numeric overruns in report mode', () => {
  const { execFileSync } = require('node:child_process');
  const { randomBytes } = require('node:crypto');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-bundle-audit-'));
  try {
    const scripts = path.join(directory, 'scripts');
    const dist = path.join(directory, 'dist');
    for (const folder of [scripts, ...['js', 'css', 'fonts'].map((name) => path.join(dist, name))])
      fs.mkdirSync(folder, { recursive: true });
    for (const file of ['check-bundle.cjs', 'bundle-budget.cjs'])
      fs.copyFileSync(path.join(__dirname, file), path.join(scripts, file));
    for (const name of [
      'app',
      'chunk-vendors',
      'web-vitals',
      ...['en', 'ru', 'es', 'pt', 'zh-cn', 'zh-tw', 'vi'].flatMap((lang) => [`locale-${lang}`, `wiki-locale-${lang}`]),
    ]) {
      fs.writeFileSync(path.join(dist, 'js', `${name}.123.js`), '// fixture');
    }
    const sourceMap = path.join(dist, 'js', 'app.123.js.map');
    fs.writeFileSync(sourceMap, JSON.stringify({ sources: ['src/main.ts'] }));
    fs.writeFileSync(path.join(dist, 'js', 'app.123.js'), randomBytes(400000).toString('base64'));
    const command = [path.join(scripts, 'check-bundle.cjs')];
    const env = { ...process.env, AVALON_BUNDLE_BUDGET: 'report' };
    execFileSync(process.execPath, command, { env, stdio: 'pipe' });
    assert.ok(JSON.parse(fs.readFileSync(path.join(dist, 'bundle-budget.json'))).violations.length > 0);
    assert.throws(
      () => execFileSync(process.execPath, command, { env: { ...env, AVALON_BUNDLE_BUDGET: '' }, stdio: 'pipe' }),
      /budget limit/,
    );
    fs.writeFileSync(sourceMap, JSON.stringify({ sources: ['node_modules/mongoose/index.js'] }));
    assert.throws(() => execFileSync(process.execPath, command, { env, stdio: 'pipe' }), /server dependency/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
