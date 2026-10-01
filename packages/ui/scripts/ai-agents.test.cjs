const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createI18n } = require('vue-i18n');

const locales = ['ru', 'en', 'es', 'pt', 'zh_CN', 'zh_TW'];
const keys = [
  'analyst',
  'diplomat',
  'gambler',
  'guardian',
  'provocateur',
  'independent',
  'captain',
  'observer',
  'loyalist',
  'accuser',
];
const messages = Object.fromEntries(
  locales.map((locale) => {
    const source = fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/aiAgents.ts`), 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const mod = { exports: {} };
    new Function('exports', 'module', js)(mod.exports, mod);
    return [locale, { aiAgents: mod.exports.default }];
  }),
);

test('all interface languages explain all ten personalities', () => {
  for (const locale of locales) {
    assert.deepEqual(Object.keys(messages[locale].aiAgents), keys);
    for (const key of keys) {
      assert.ok(messages[locale].aiAgents[key].title.trim());
      assert.ok(messages[locale].aiAgents[key].description.trim());
    }
  }
});

test('changing interface language changes a personality explanation', () => {
  const i18n = createI18n({ legacy: false, locale: 'ru', messages });
  assert.equal(i18n.global.t('aiAgents.gambler.title'), 'Азартный экспериментатор');
  const russian = i18n.global.t('aiAgents.gambler.description');
  i18n.global.locale.value = 'en';
  assert.equal(i18n.global.t('aiAgents.gambler.title'), 'Bold experimenter');
  assert.notEqual(i18n.global.t('aiAgents.gambler.description'), russian);
});
