const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  languages,
  normalizeLanguage,
  preferredLanguage,
  pageLanguage,
  parseStoredObject,
} = require('../src/helpers/i18n/policy');
const { basePath, localizedPath, isNeutralPath, neutralRoomUrl } = require('../src/router/paths');

const saved = (value, isDefault = false) => ({ locale: { value, isDefault } });
const resolve = (path, settings, browser) =>
  pageLanguage(path, isNeutralPath(path), preferredLanguage(settings, browser));

test('search and old unprefixed public URLs have stable English content, even for a Russian user', () => {
  for (const path of ['/', '/wiki/roles/', '/wiki/rules/', '/about/', '/stats/']) {
    assert.equal(resolve(path, saved('ru'), ['ru-RU']), 'en');
  }
});

test('explicit public language wins over browser and saved preference in every locale', () => {
  for (const language of languages) {
    assert.equal(resolve(localizedPath('/wiki/roles/', language), saved('pt'), ['es-ES']), language);
  }
  assert.equal(resolve('/zh-tw/wiki/rules/', saved('en'), ['ru']), 'zh-TW');
});

test('shared rooms use the recipient preference, not a sender language prefix', () => {
  for (const language of languages) {
    assert.equal(resolve(localizedPath('/room/Game-ID/', language), saved('ru'), ['en']), 'ru');
    assert.equal(resolve(localizedPath('/room/Game-ID/', language), null, ['pt-BR']), 'pt');
  }
});

test('all private routes follow the same recipient language policy; public stats does not', () => {
  for (const path of [
    '/profile/',
    '/leaderboard/',
    '/stats/user/ID/',
    '/achievements/user/ID/',
    '/achievements/global/',
  ]) {
    assert.equal(resolve(path, saved('es'), ['ru-RU']), 'es');
    assert.equal(isNeutralPath(localizedPath(path, 'zh-TW')), true);
  }
  for (const path of ['/stats/', '/wiki/roles/', '/room/', '/room/ID/extra/', '/unknown/']) {
    assert.equal(isNeutralPath(path), false);
  }
});

test('English is a real saved choice; automatic/default settings defer to the browser', () => {
  assert.equal(preferredLanguage(saved('en'), ['ru']), 'en');
  assert.equal(preferredLanguage(saved('en', true), ['ru']), 'ru');
  assert.equal(preferredLanguage(saved('invalid'), ['es-MX']), 'es');
  assert.equal(preferredLanguage(saved('zh-tw'), ['en']), 'zh-TW');
});

test('browser preference order and regional language codes are respected', () => {
  for (const [browser, expected] of [
    [['fr-FR', 'ru-RU', 'en-US'], 'ru'],
    [['en-GB', 'ru'], 'en'],
    [['pt-BR'], 'pt'],
    [['es-419'], 'es'],
    [['de-DE'], 'en'],
    [[], 'en'],
  ])
    assert.equal(preferredLanguage(null, browser), expected);
});

test('Chinese script variants and regions choose the appropriate translation', () => {
  for (const code of ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'zh-Hant-CN']) {
    assert.equal(preferredLanguage(null, [code]), 'zh-TW');
  }
  for (const code of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-TW']) {
    assert.equal(preferredLanguage(null, [code]), 'zh-CN');
  }
});

test('corrupt, missing and outdated settings do not prevent language selection', () => {
  for (const raw of [null, '{broken', 'null', '[]', '"ru"', '42']) {
    assert.equal(parseStoredObject(raw), null);
    assert.equal(preferredLanguage(parseStoredObject(raw), ['ru']), 'ru');
  }
  for (const raw of ['{}', '{"locale":null}', '{"locale":"ru"}', '{"locale":{"value":"xx","isDefault":false}}']) {
    assert.equal(preferredLanguage(parseStoredObject(raw), ['ru']), 'ru');
  }
  assert.equal(normalizeLanguage(null), undefined);
});

test('switching public language preserves the page; English can always be reopened without a loop', () => {
  for (const language of languages) {
    const translated = localizedPath('/wiki/roles/merlin/', language);
    assert.equal(localizedPath(translated, 'en'), '/wiki/roles/merlin/');
    assert.equal(basePath(translated), '/wiki/roles/merlin/');
  }
  assert.equal(basePath('/wiki/expansions/'), '/wiki/expansions/');
});

test('room sharing preserves UUID case, query parameters and fragment without forcing a language', () => {
  for (const language of languages) {
    const original = 'https://avalon-game.com' + localizedPath('/room/Game-ID/', language) + '?invite=abc%2Bdef#chat';
    assert.equal(neutralRoomUrl(original), 'https://avalon-game.com/room/Game-ID/?invite=abc%2Bdef#chat');
  }
});
