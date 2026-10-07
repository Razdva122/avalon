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

async function fixture(
  file,
  { props = {}, locale = 'en', activeRoomID, acknowledge = async () => ({ roomID: 'created-room' }) } = {},
) {
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
              return acknowledge(...args);
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
  const renderHtml = () => {
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
    return renderToString(app);
  };
  const html = await renderHtml();
  function nodes(type, node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [
      ...(node.type === type ? [node] : []),
      ...(Array.isArray(node.children) ? node.children.flatMap((child) => nodes(type, child)) : []),
    ];
  }
  return { html, nodes, sent, navigation, access, render: renderHtml, stop: () => scope.stop() };
}

test('native language selection sends the chosen language when creating an AI room', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue');
  t.after(room.stop);
  const selects = room.nodes('select');
  assert.equal(selects.length, 3, 'new-room controls need model, discussion language and player count selects');
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
  assert.deepEqual(room.sent, [['createAiRoom', { model: 'yandex', language: 'zh-tw', playerCount: 7 }]]);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'created-room' } }]);
});

test('new AI rooms keep English as the default discussion language', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue', { locale: 'ru' });
  t.after(room.stop);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, [['createAiRoom', { model: 'codex-chatgpt', language: 'en', playerCount: 7 }]]);
});

for (const playerCount of [5, 6, 7, 8]) {
  test(`native player count selection creates a ${playerCount}-bot room`, async (t) => {
    const room = await fixture('pages/lobby/AiRoomButton.vue');
    t.after(room.stop);
    const count = room.nodes('select')[2];
    assert.ok(count, 'missing player count control');
    assert.deepEqual(
      room.nodes('option', count).map((option) => option.props.value),
      [5, 6, 7, 8],
    );
    assert.match(room.html, /<label[^>]*><span>Number of bots<\/span>\s*<select/);
    assert.equal(count.dirs[0].value, 7, 'seven bots should be selected by default');
    count.props['onUpdate:modelValue'](playerCount);
    const html = await room.render();
    assert.ok(html.includes(`AI match · ${playerCount} bots`));
    await room.nodes('v-btn')[0].props.onClick();
    assert.deepEqual(room.sent, [['createAiRoom', { model: 'codex-chatgpt', language: 'en', playerCount }]]);
  });
}

test('new-room selects stay disabled while creation awaits acknowledgement', async (t) => {
  let finish;
  const room = await fixture('pages/lobby/AiRoomButton.vue', {
    acknowledge: () => new Promise((resolve) => (finish = resolve)),
  });
  t.after(room.stop);
  const opening = room.nodes('v-btn')[0].props.onClick();
  await room.render();
  assert.equal(room.nodes('select').length, 3);
  assert.ok(room.nodes('select').every((select) => select.props.disabled));
  finish({ roomID: 'created-room' });
  await opening;
  await room.render();
  assert.ok(room.nodes('select').every((select) => !select.props.disabled));
});

test('opening an active AI room navigates without creating or changing its language', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue', { activeRoomID: 'active-room' });
  t.after(room.stop);
  assert.equal(room.nodes('select').length, 0);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'active-room' } }]);
});

test('opening a newly active room ignores the draft bot count', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue');
  t.after(room.stop);
  const count = room.nodes('select')[2];
  assert.ok(count, 'missing player count control');
  count.props['onUpdate:modelValue'](5);
  room.access.activeRoomID.value = 'active-room';
  await room.render();
  assert.equal(room.nodes('select').length, 0);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'active-room' } }]);
});

test('room panel summary uses the saved count, the legacy seat count, then seven', async (t) => {
  for (const [saved, seats, expected] of [
    [5, 7, 5],
    [6, undefined, 6],
    [7, 5, 7],
    [8, 7, 8],
    [undefined, 5, 5],
    [undefined, 6, 6],
    [undefined, 8, 8],
    [undefined, undefined, 7],
  ]) {
    const room = await fixture('components/view/panels/AiRoomPanel.vue', {
      props: { roomID: 'room', playerCount: seats, ai: { model: 'yandex', status: 'ready', playerCount: saved } },
    });
    t.after(room.stop);
    assert.match(room.html, new RegExp(`<summary>[\\s\\S]*?<small>${expected} bots<\\/small>[\\s\\S]*?<\\/summary>`));
  }
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
    assert.equal(room.nodes('select').length, 3);
    assert.ok(!room.html.includes('aiArena.selectLanguage'), `${locale} is missing the select label`);
    assert.ok(!room.html.includes('aiArena.selectPlayerCount'), `${locale} is missing the bot count label`);
    assert.ok(!panel.html.includes('aiArena.playerCount'), `${locale} is missing the saved count label`);
    assert.ok(!panel.html.includes('aiArena.language'), `${locale} is missing the saved-language label`);
    assert.ok(panel.html.includes('Русский'), `${locale} does not display the saved language`);
  }
});

for (const playerCount of [5, 6, 7, 8]) {
  test(`lobby tagline displays the actual ${playerCount}-bot room size`, async (t) => {
    const room = await fixture('pages/lobby/LobbyRoom.vue', {
      props: {
        game: {
          uuid: 'room',
          hostID: 'host',
          ai: true,
          aiStatus: 'ready',
          players: playerCount,
          state: 'created',
          options: { roles: {}, addons: {} },
          createAt: '2026-10-03T00:00:00Z',
        },
      },
    });
    t.after(room.stop);
    assert.ok(room.html.includes(`<span class="ai-title">${playerCount} bots. Two sides.</span>`));
  });
}

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

test('administrator owner joins from the ready panel; visitors and launched games have no join control', async (t) => {
  const props = { roomID: 'mixed', canJoin: true, ai: { model: 'yandex', status: 'ready', playerCount: 7 } };
  const room = await fixture('components/view/panels/AiRoomPanel.vue', {
    props,
    acknowledge: async () => ({ ok: true }),
  });
  t.after(room.stop);
  const join = room.nodes('v-btn').find((node) => String(node.children).includes('Play with bots'));
  assert.ok(join, 'owner needs a join control');
  await join.props.onClick();
  assert.deepEqual(room.sent, [['joinAiRoom', 'mixed']]);
  for (const variant of [
    { ...props, canJoin: false },
    { ...props, ai: { ...props.ai, status: 'running' } },
    { ...props, ai: { ...props.ai, humanPlayerID: 'owner' } },
  ]) {
    const panel = await fixture('components/view/panels/AiRoomPanel.vue', { props: variant });
    t.after(panel.stop);
    assert.ok(!panel.html.includes('Play with bots'));
  }
});

test('mixed game summary counts the bots separately from the single human', async (t) => {
  const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
    locale: 'ru',
    props: { roomID: 'mixed', ai: { status: 'running', playerCount: 7, humanPlayerID: 'owner' } },
  });
  t.after(panel.stop);
  assert.ok(panel.html.includes('1 человек + 6 ботов'));
});

test('room owner can reach the join control with an authenticated profile that omits the admin flag', async (t) => {
  const filename = path.join(__dirname, '../src/pages/room/Room.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const source = ts.createSourceFile(filename, descriptor.script.content, ts.ScriptTarget.Latest, true);
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'canJoinAi')
      initializer = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(initializer);
  const store = { state: { profile: { id: 'owner' } } };
  const roomState = vue.ref({ leaderID: 'owner', ai: { status: 'ready' } });
  const userID = vue.computed(() => store.state.profile.id);
  const canJoin = new Function('computed', 'store', 'roomState', 'userID', `return (${initializer});`)(
    vue.computed,
    store,
    roomState,
    userID,
  );
  assert.equal(canJoin.value, true);
  const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
    props: { roomID: 'room', ai: roomState.value.ai, canJoin: canJoin.value },
  });
  t.after(panel.stop);
  assert.ok(panel.html.includes('Play with bots'));
  panel.access.canManage.value = false;
  assert.ok(!(await panel.render()).includes('Play with bots'), 'server permission is still required');
  roomState.value.leaderID = 'another-owner';
  assert.equal(canJoin.value, false);
});
