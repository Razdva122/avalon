const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadPricing() {
  const file = path.join(__dirname, '../src/helpers/codex-pricing.ts');
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', js)(module.exports, module);
  return module.exports;
}

test('one comparable API price uses the cheapest available known model as $1', () => {
  const { codexRelativePrice } = loadPricing();
  const models = ['gpt-6-luna', 'gpt-6-astra', 'gpt-6.1-sol', 'gpt-5.6-terra'];
  assert.equal(codexRelativePrice('gpt-6-luna', models), '$1');
  assert.equal(codexRelativePrice('gpt-6-astra', models), '$100');
  assert.equal(codexRelativePrice('gpt-6.1-sol', models), '$20');
  assert.equal(codexRelativePrice('gpt-5.6-terra', models), '$23.3');
  assert.equal(codexRelativePrice('gpt-6-astra', ['gpt-6.1-sol', 'gpt-6-astra']), '$5');
});

test('unknown models are not presented as cheap or priced using a similar name', () => {
  const { codexRelativePrice } = loadPricing();
  assert.equal(codexRelativePrice('future-model', ['future-model', 'gpt-6-luna']), undefined);
  assert.equal(codexRelativePrice('gpt-6-luna', ['future-model']), undefined);
  assert.equal(codexRelativePrice('gpt-6-luna-other', ['gpt-6-luna-other']), undefined);
});
