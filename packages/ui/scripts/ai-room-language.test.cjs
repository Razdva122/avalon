const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');

function evaluate(source, load = require) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports;
}
const locales = ['en', 'ru', 'es', 'pt', 'zh_CN', 'zh_TW'];
const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    {
      aiArena: evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/aiArena.ts`), 'utf8'))
        .default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/room.ts`), 'utf8')).default,
    },
  ]),
);

async function fixture(file, { props = {}, locale = 'en', activeRoomID } = {}) {
  const sent = [];
  const navigation = [];
  const access = {
    canManage: vue.ref(true),
    budget: vue.ref(undefined),
    models: vue.ref([]),
    defaultModel: vue.ref('codex-chatgpt'),
    activeRoomID: vue.ref(activeRoomID),
    costs: vue.ref({}),
    limits: vue.ref({}),
    codexModels: vue.ref([]),
    refresh: async () => {},
  };
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: false, messages });
  const filename = path.join(__dirname, '../src', file);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename });
  const component = evaluate(script.content, (id) => {
    if (id === 'vue') return vue;
    if (id === 'vue-i18n') return { useI18n: () => i18n.global };
    if (id === 'vue-router') return { useRouter: () => ({ push: async (route) => navigation.push(route) }) };
    if (id === '@/helpers/composables/useAiAccess') return { useAiAccess: () => access };
    if (id === '@/helpers/composables') return { useUserProfile: () => ({ userName: vue.ref('Host') }) };
    if (id === '@/api/socket')
      return {
        socket: {
          timeout: () => ({
            emitWithAck: async (...args) => {
              sent.push(args);
              return { roomID: 'created-room' };
            },
          }),
        },
      };
    if (id === '@avalon/types/room/ai-model')
      return evaluate(fs.readFileSync(path.join(__dirname, '../../types/room/ai-model.ts'), 'utf8'));
    if (id === '@/helpers/codex-pricing')
      return evaluate(fs.readFileSync(path.join(__dirname, '../src/helpers/codex-pricing.ts'), 'utf8'));
    if (id.endsWith('.vue')) return { default: { render: () => null } };
    throw Error(`Unexpected import: ${id}`);
  }).default;
  const template = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: filename,
    compilerOptions: { bindingMetadata: script.bindings, isCustomElement: (tag) => tag === 'v-btn' },
  });
  assert.deepEqual(template.errors, []);
  const render = evaluate(template.code).render;
  const scope = vue.effectScope();
  const state = scope.run(() => component.setup(vue.reactive(props), { expose() {}, emit() {} }));
  access.models.value = [
    { id: 'codex-chatgpt', label: 'Codex' },
    { id: 'yandex', label: 'Yandex' },
  ];
  await vue.nextTick();
  let tree;
  const app = vue.createSSRApp(
    {
      props: component.props,
      setup: () => state,
      render(...args) {
        tree = render.apply(this, args);
        return tree;
      },
    },
    props,
  );
  app.config.globalProperties.$t = i18n.global.t;
  app.component('RouterLink', {
    setup:
      (_, { slots }) =>
      () =>
        vue.h('a', slots.default?.()),
  });
  const html = await renderToString(app);
  function nodes(type, node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [
      ...(node.type === type ? [node] : []),
      ...(Array.isArray(node.children) ? node.children.flatMap((child) => nodes(type, child)) : []),
    ];
  }
  return { html, nodes, sent, navigation, stop: () => scope.stop() };
}

test('native language selection sends the chosen language when creating an AI room', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue');
  t.after(room.stop);
  const selects = room.nodes('select');
  assert.equal(selects.length, 2, 'new-room controls need separate model and discussion language selects');
  const language = selects[1];
  assert.deepEqual(
    room.nodes('option', language).map((option) => [option.props.value, option.children]),
    [
      ['en', 'English'],
      ['ru', 'Русский'],
      ['zh-tw', '繁體中文（台灣）'],
    ],
  );
  assert.match(room.html, /<label[^>]*><span>Discussion language<\/span>\s*<select/);
  selects[0].props['onUpdate:modelValue']('yandex');
  language.props['onUpdate:modelValue']('zh-tw');
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, [['createAiRoom', { model: 'yandex', language: 'zh-tw' }]]);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'created-room' } }]);
});

test('new AI rooms keep English as the default discussion language', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue', { locale: 'ru' });
  t.after(room.stop);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, [['createAiRoom', { model: 'codex-chatgpt', language: 'en' }]]);
});

test('opening an active AI room navigates without creating or changing its language', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue', { activeRoomID: 'active-room' });
  t.after(room.stop);
  assert.equal(room.nodes('select').length, 0);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'active-room' } }]);
});

test('room panel displays saved discussion languages and defaults legacy rooms to English', async (t) => {
  for (const [language, label] of [
    [undefined, 'English'],
    ['en', 'English'],
    ['ru', 'Русский'],
    ['zh-tw', '繁體中文（台灣）'],
  ]) {
    const room = await fixture('components/view/panels/AiRoomPanel.vue', {
      props: { roomID: 'room', ai: { model: 'yandex', status: 'ready', language } },
    });
    t.after(room.stop);
    assert.ok(room.html.includes(`Discussion language: ${label}`), `missing saved-language display for ${language}`);
  }
});

test('all interface locales provide language control and saved-language labels', async (t) => {
  for (const locale of locales) {
    const room = await fixture('pages/lobby/AiRoomButton.vue', { locale });
    const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
      locale,
      props: { roomID: 'room', ai: { model: 'yandex', status: 'ready', language: 'ru' } },
    });
    t.after(room.stop);
    t.after(panel.stop);
    assert.equal(room.nodes('select').length, 2);
    assert.ok(!room.html.includes('aiArena.selectLanguage'), `${locale} is missing the select label`);
    assert.ok(!panel.html.includes('aiArena.language'), `${locale} is missing the saved-language label`);
    assert.ok(panel.html.includes('Русский'), `${locale} does not display the saved language`);
  }
});

test('lobby badges identify each saved AI room language and default legacy rooms to English', async (t) => {
  for (const [language, label] of [
    [undefined, 'English'],
    ['ru', 'Русский'],
    ['zh-tw', '繁體中文（台灣）'],
  ]) {
    const room = await fixture('pages/lobby/LobbyRoom.vue', {
      props: {
        game: {
          uuid: 'room',
          hostID: 'host',
          ai: true,
          aiLanguage: language,
          aiStatus: 'ready',
          players: 7,
          state: 'created',
          options: { roles: {}, addons: {} },
          createAt: '2026-10-03T00:00:00Z',
        },
      },
    });
    t.after(room.stop);
    assert.ok(room.html.includes(`<span>${label}</span>`), `wrong lobby badge for ${language}`);
  }
});
