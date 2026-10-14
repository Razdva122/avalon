const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');
const { createRouter, createMemoryHistory } = require('vue-router');

function load(file, resolve = require) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'exports', code)(resolve, exports);
  return exports;
}
const avatars = load('../../types/stats/achievement-avatars.ts');
const { cosmeticRewards } = load('../src/i18n/langs/pages/cosmeticRewards.ts');
const { descriptor } = parse(
  fs.readFileSync(require.resolve('../src/components/achievements/AchievementPopup.vue'), 'utf8'),
);
const exportsObject = {};
new Function(
  'require',
  'exports',
  ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)((id) => (id === '@avalon/types/stats/achievement-avatars' ? avatars : require(id)), exportsObject);
const Popup = exportsObject.default;
Popup.render = vue.compile(descriptor.template.content);

async function render(locale, props) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ name: 'profile', path: '/profile/', component: { render: () => null } }],
  });
  await router.push('/profile/');
  const app = vue
    .createSSRApp(Popup, props)
    .use(router)
    .use(
      createI18n({
        legacy: false,
        locale,
        fallbackLocale: false,
        messages: {
          [locale]: {
            cosmeticRewards: cosmeticRewards[locale],
            stickers: { collection: 'Collection' },
            infoMessage: { close: 'Close' },
          },
        },
      }),
    );
  app.component('v-icon', { render: () => vue.h('span', { 'aria-hidden': 'true' }) });
  return renderToString(app);
}

test('the compact reward popup renders localized counts and a collection link for every locale', async () => {
  for (const locale of Object.keys(cosmeticRewards)) {
    const html = await render(locale, {
      achievementIDs: ['light_wins', 'dark_wins'],
      stickerIDs: ['servant-wave', 'servant-victory', 'oberon-smirk'],
    });
    assert.ok(html.includes(cosmeticRewards[locale].received), locale);
    for (const [key, count] of [
      ['earnedAchievements', 2],
      ['earnedStickers', 3],
      ['earnedAvatars', 2],
    ]) {
      assert.ok(html.includes(cosmeticRewards[locale][key].replace('{count}', count)), `${locale}/${key}`);
    }
    assert.match(html, /href="\/profile\/#stickers"/);
    assert.match(html, /role="status"/);
    assert.doesNotMatch(html, /<img|achievement-popup__rewards/);
  }
});

test('sticker-only rewards omit empty achievement and avatar counts', async () => {
  const html = await render('ru', { stickerIDs: ['servant-wave'] });
  assert.match(html, /Стикеры: 1/);
  assert.doesNotMatch(html, /Достижения:|Аватары:/);
});
