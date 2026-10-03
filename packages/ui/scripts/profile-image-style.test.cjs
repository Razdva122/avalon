const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { createStore } = require('vuex');
const { createI18n } = require('vue-i18n');
const { renderToString } = require('@vue/server-renderer');
const { parse } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });

const root = path.resolve(__dirname, '../src');
function load(source, resolve) {
  const exports = {};
  new Function(
    'require',
    'exports',
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(resolve, exports);
  return exports;
}
const webpackRequire = (id) => require(id);
webpackRequire.context = (request) => (key) => {
  const file = path.join(root, request.replace('@/', ''), key);
  assert.ok(fs.statSync(file).isFile(), `Missing preview: ${file}`);
  return file;
};
const images = load(fs.readFileSync(path.join(root, 'helpers/images/index.ts'), 'utf8'), webpackRequire);
const { descriptor } = parse(fs.readFileSync(path.join(root, 'pages/profile/Profile.vue'), 'utf8'));
const leaf = { render: () => null };
const Profile = load(descriptor.script.content, (id) => {
  if (id === 'vue') return vue;
  if (id === '@/helpers/images') return images;
  if (id.endsWith('.vue')) return { default: leaf };
  if (id === '@/helpers/i18n') return { LanguageMap: {} };
  if (id === '@/helpers/validators') return { validators: { name: () => true } };
  return {};
}).default;
Profile.render = vue.compile(descriptor.template.content);

function profileStore(style) {
  return createStore({
    state: { profile: { id: 'player', name: 'Player', avatar: 'servant' }, settings: style ? { style } : null },
    mutations: {
      updateUserSettings(state, { key, value }) {
        state.settings ??= {};
        state.settings[key] = value;
      },
    },
  });
}

test('profile shows three distinct selectable previews and descriptions in every language', async () => {
  for (const [locale, moduleName] of Object.entries({
    en: 'en',
    ru: 'ru',
    es: 'es',
    pt: 'pt',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
  })) {
    const messages = require(path.join(root, 'i18n/langs', moduleName, 'ui.ts')).default;
    const modals = require(path.join(root, 'i18n/langs', moduleName, 'modals.ts')).default;
    const store = profileStore();
    const app = vue
      .createSSRApp(Profile)
      .use(store)
      .use(
        createI18n({
          legacy: false,
          locale,
          fallbackLocale: false,
          messages: {
            [locale]: { ...messages, ...modals, roles: { merlin: 'Merlin' }, menu: { achievements: 'Achievements' } },
          },
        }),
      );
    const wrapper = {
      render() {
        return vue.h('div', null, this.$slots.default?.());
      },
    };
    for (const name of new Set(descriptor.template.content.match(/v-[\w-]+(?=[\s>])/g))) app.component(name, wrapper);
    const html = await renderToString(app);
    const choices = html.match(/<button\b[^>]*class="image-style-option"[\s\S]*?<\/button>/g) ?? [];
    assert.equal(choices.length, 3, locale);
    assert.match(choices[0], /aria-pressed="true"/);
    assert.match(choices[1], /aria-pressed="false"/);
    assert.match(choices[2], /aria-pressed="false"/);
    for (const [index, file] of [
      'roles/merlin.webp',
      'roles/legacy/merlin.webp',
      'roles/anime/merlin.webp',
    ].entries()) {
      assert.ok(choices[index].includes(path.join(root, 'assets/images', file)), `${locale}/${file}`);
      assert.ok(
        choices[index].includes(
          messages.profile[['styleDefaultDescription', 'styleLegacyDescription', 'styleAnimeDescription'][index]],
        ),
      );
    }
    assert.doesNotMatch(html, /profile\.(?:imageStyleHint|imageStyleNote|style\w+Description)/);
    if (locale === 'ru') assert.match(choices[1], /Иллюстрации из оригинальной игры/);
  }
});

test('choosing a style updates the saved preference and respects it when reopening the profile', () => {
  const store = profileStore('anime');
  const state = { $store: store };
  assert.equal(Profile.computed.imageStyle.get.call(state), 'anime');
  for (const style of ['legacy', 'default', 'anime']) {
    Profile.computed.imageStyle.set.call(state, style);
    assert.equal(store.state.settings.style, style);
    assert.equal(Profile.computed.imageStyle.get.call({ $store: store }), style);
  }
});
