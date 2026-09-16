const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { createMessageLoader, createLanguageSelection } = require('../src/plugins/i18n/loader.ts');

test('load only the selected locale and English fallback, deduplicating concurrent requests', async () => {
  const fetched = [];
  const installed = [];
  const loaders = Object.fromEntries(
    ['en', 'ru', 'es', 'pt', 'zh-CN', 'zh-TW'].map((lang) => [
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
