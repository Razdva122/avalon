const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { createMessageLoader, createLanguageSelection } = require('../src/plugins/i18n/loader.ts');

test('load only the selected locale and English fallback, deduplicating concurrent requests', async () => {
  const fetched = [];
  const installed = [];
  const loaders = Object.fromEntries(
    ['en', 'ru', 'es', 'pt', 'zh-CN', 'zh-TW', 'vi'].map((lang) => [
      lang,
      async () => {
        fetched.push(lang);
        return { title: lang };
      },
    ]),
  );
  const load = createMessageLoader(loaders, (lang, messages) => installed.push([lang, messages.title]));
  await Promise.all([load('ru'), load('ru'), load('en')]);
  assert.deepEqual(fetched, ['en', 'ru']);
  assert.deepEqual(installed, [
    ['en', 'en'],
    ['ru', 'ru'],
  ]);
  await load('zh-TW');
  assert.deepEqual(fetched, ['en', 'ru', 'zh-TW']);
});

test('failed locale chunks can be retried without reinstalling fallback', async () => {
  let attempts = 0;
  const installed = [];
  const load = createMessageLoader(
    {
      en: async () => ({ title: 'English' }),
      ru: async () => {
        if (++attempts === 1) throw Error('offline');
        return { title: 'Русский' };
      },
    },
    (lang) => installed.push(lang),
  );
  await assert.rejects(load('ru'), /offline/);
  assert.deepEqual(installed, ['en']);
  await load('ru');
  assert.deepEqual(installed, ['en', 'ru']);
});

test('slow earlier language selection cannot replace the latest choice or route language', async () => {
  const pending = {};
  const applied = [];
  const { select, commit } = createLanguageSelection(
    (lang) =>
      new Promise((resolve) => {
        pending[lang] = resolve;
      }),
    (lang) => applied.push(lang),
  );
  const russian = select('ru');
  const chinese = select('zh-TW');
  pending['zh-TW']();
  assert.equal(await chinese, true);
  pending.ru();
  assert.equal(await russian, false);
  assert.deepEqual(applied, ['zh-TW']);
  const portuguese = select('pt');
  commit('en');
  pending.pt();
  assert.equal(await portuguese, false);
  assert.deepEqual(applied, ['zh-TW', 'en']);
});

test('failed language choice keeps the current interface language', async () => {
  let active = 'en';
  const { select } = createLanguageSelection(
    async () => {
      throw Error('offline');
    },
    (lang) => {
      active = lang;
    },
  );
  await assert.rejects(select('ru'), /offline/);
  assert.equal(active, 'en');
});

test('Trapper article dictionaries load only for its page, preserve common messages and reuse cached fallback', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const ts = require('typescript');
  const calls = [];
  const languages = ['en', 'ru', 'es', 'pt', 'vi', 'zh-CN', 'zh-TW'];
  const loaders = (group) =>
    Object.fromEntries(
      languages.map((language) => [
        language,
        async () => {
          calls.push(`${group}:${language}`);
          return { [group]: { title: `${group}:${language}` } };
        },
      ]),
    );
  const module = { exports: {} };
  const dependencies = {
    'vue-i18n': require('vue-i18n'),
    '@/helpers/i18n': { selectLocale: () => 'en' },
    '@/i18n': {
      localeLoaders: loaders('common'),
      wikiLocaleLoaders: loaders('wiki'),
      trapperLocaleLoaders: loaders('trapperGuide'),
    },
    './loader': require('../src/plugins/i18n/loader.ts'),
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/plugins/i18n/index.ts'), 'utf8');
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  )((name) => dependencies[name], module, module.exports);
  const { loadWikiLanguage, i18n } = module.exports;
  await loadWikiLanguage('ru');
  assert.deepEqual(calls, ['common:en', 'common:ru', 'wiki:en', 'wiki:ru']);
  await loadWikiLanguage('ru', 'trapper');
  assert.deepEqual(calls.slice(4), ['trapperGuide:en', 'trapperGuide:ru']);
  assert.equal(i18n.global.getLocaleMessage('ru').common.title, 'common:ru');
  assert.equal(i18n.global.getLocaleMessage('ru').wiki.title, 'wiki:ru');
  assert.equal(i18n.global.getLocaleMessage('ru').trapperGuide.title, 'trapperGuide:ru');
  await loadWikiLanguage('ru', 'trapper');
  assert.equal(calls.length, 6);
  await loadWikiLanguage('es', 'trapper');
  assert.deepEqual(calls.slice(6), ['common:es', 'wiki:es', 'trapperGuide:es']);
});

test('route guard loads Trapper articles for case-insensitive matches and leaves other wiki routes unchanged', async () => {
  const fs = require('node:fs');
  const ts = require('typescript');
  const { createRouter, createMemoryHistory } = require('vue-router');
  const { basePath } = require('../src/router/paths');
  const routerSource = fs.readFileSync(require('node:path').join(__dirname, '../src/router/index.ts'), 'utf8');
  const guardSource = routerSource.slice(
    routerSource.indexOf('router.beforeResolve('),
    routerSource.indexOf('router.afterEach('),
  );
  let guard;
  const calls = [];
  new Function(
    'router',
    'pageLanguage',
    'isNeutralPath',
    'preferredLanguage',
    'store',
    'navigator',
    'basePath',
    'loadWikiLanguage',
    'loadLanguage',
    ts.transpileModule(guardSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  )(
    {
      beforeResolve: (fn) => {
        guard = fn;
      },
    },
    () => 'ru',
    () => false,
    () => 'ru',
    { state: { settings: {} } },
    { languages: ['ru'] },
    basePath,
    async (...args) => calls.push(['wiki', ...args]),
    async (...args) => calls.push(['common', ...args]),
  );
  const routes = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/ru/wiki/expansions/trapper/', meta: { id: 'trapper' }, component: {} },
      { path: '/ru/wiki/roles/merlin/', meta: { id: 'merlin' }, component: {} },
    ],
  });
  await guard(routes.resolve('/ru/wiki/expansions/Trapper/'));
  await guard(routes.resolve('/ru/Wiki/Expansions/Trapper/'));
  await guard(routes.resolve('/ru/wiki/roles/merlin/'));
  assert.deepEqual(calls, [
    ['wiki', 'ru', 'trapper'],
    ['wiki', 'ru', 'trapper'],
    ['wiki', 'ru', undefined],
  ]);
});
