const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const webpack = require('webpack');
const { execFileSync } = require('node:child_process');
const { createI18n } = require('vue-i18n');

test('runtime dictionaries translate history labels and unchanged generation preserves their mtimes', () => {
  const generator = path.join(__dirname, 'generate-locales.cjs');
  execFileSync(process.execPath, [generator]);
  const output = path.join(__dirname, '../src/i18n/generated');
  const before = fs.readdirSync(output).map((name) => [name, fs.statSync(path.join(output, name)).mtimeMs]);
  execFileSync(process.execPath, [generator]);
  for (const [name, mtime] of before) {
    assert.equal(fs.statSync(path.join(output, name)).mtimeMs, mtime);
    const messages = JSON.parse(fs.readFileSync(path.join(output, name), 'utf8'));
    const i18n = createI18n({ legacy: false, locale: 'test', messages: { test: messages } });
    for (const key of ['vote.attempt', 'vote.statusRejected', 'vote.statusApproved', 'mission.cards']) {
      const text = i18n.global.t(key, { index: 2 });
      assert.notEqual(text, key, `${name}: untranslated ${key}`);
      assert.ok(!text.includes('{index}'));
    }
  }
});

test('webpack regenerates locale JSON when translation sources change during watch', { timeout: 15000 }, async () => {
  const LocaleGenerationPlugin = require('./locale-generation-plugin.cjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-locales-'));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'src/i18n/langs'), { recursive: true });
  const source = path.join(root, 'src/i18n/langs/history.ts');
  fs.writeFileSync(source, '"Before"');
  fs.writeFileSync(
    path.join(root, 'scripts/generate-locales.cjs'),
    `
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.resolve(__dirname, '..');
    const content = fs.readFileSync(path.join(root, 'src/i18n/langs/history.ts'), 'utf8');
    const output = path.join(root, 'src/i18n/generated/ru.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) fs.writeFileSync(output, content);
  `,
  );
  fs.writeFileSync(path.join(root, 'entry.js'), 'module.exports = require("./src/i18n/generated/ru.json");');
  const compiler = webpack({
    context: root,
    mode: 'development',
    target: 'node',
    entry: './entry.js',
    output: { path: path.join(root, 'dist'), filename: 'bundle.cjs', library: { type: 'commonjs2' } },
    plugins: [new LocaleGenerationPlugin()],
  });
  let watcher;
  try {
    await new Promise((resolve, reject) => {
      let builds = 0;
      watcher = compiler.watch({ aggregateTimeout: 20, poll: 50 }, (error, stats) => {
        if (error || stats.hasErrors()) return reject(error || new Error(stats.toString()));
        try {
          const bundle = path.join(root, 'dist/bundle.cjs');
          delete require.cache[require.resolve(bundle)];
          assert.equal(require(bundle), builds === 0 ? 'Before' : 'After');
          if (builds++ === 0) fs.writeFileSync(source, '"After"');
          else resolve();
        } catch (failure) {
          reject(failure);
        }
      });
    });
  } finally {
    if (watcher) await new Promise((resolve) => watcher.close(resolve));
    await new Promise((resolve) => compiler.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
});
