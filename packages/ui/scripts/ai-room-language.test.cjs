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
test('Premium crown renders an SVG from the registered icon set', () => {
  const { fa } = evaluate(fs.readFileSync(path.join(__dirname, '../src/plugins/vuetify/icons.ts'), 'utf8'));
  const icon = fa.component({ tag: 'i', icon: 'fa-solid fa-crown' });
  assert.equal(icon.children[0]?.type, 'svg');
  assert.ok(icon.children[0]?.children[0]?.props.d);
});

test('lobby uses the unified AI setup instead of the old arena creation panel', () => {
  const lobby = fs.readFileSync(path.join(__dirname, '../src/pages/lobby/Lobby.vue'), 'utf8');
  assert.doesNotMatch(lobby, /AiRoomButton/);
  assert.match(lobby, /<BotRoomButton\b/);
});
const locales = ['en', 'ru', 'es', 'pt', 'zh_CN', 'zh_TW', 'vi'];
const community = evaluate(
  fs.readFileSync(path.join(__dirname, '../src/i18n/langs/pages/community.ts'), 'utf8'),
).community;
const suggestions = evaluate(fs.readFileSync(path.join(__dirname, '../src/i18n/suggestions.ts'), 'utf8'));
const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    {
      aiArena: evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/aiArena.ts`), 'utf8'))
        .default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/modals.ts`), 'utf8')).default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/room.ts`), 'utf8')).default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/ui.ts`), 'utf8'), (id) =>
        id === '../../suggestions' ? suggestions : require(id),
      ).default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/roles.ts`), 'utf8')).default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/addons.ts`), 'utf8')).default,
      wikiPlay: evaluate(fs.readFileSync(path.join(__dirname, '../src/i18n/langs/pages/wikiPlay.ts'), 'utf8')).wikiPlay[
        locale.replace('_', '-')
      ],
      community: community[locale],
    },
  ]),
);

async function fixture(
  file,
  {
    props = {},
    locale = 'en',
    activeRoomID,
    profile = { id: 'owner' },
    accessOverrides = {},
    mobile = false,
    acknowledge = async () => ({ roomID: 'created-room' }),
  } = {},
) {
  const storeState = vue.reactive({ profile });
  const sent = [];
  const navigation = [];
  const notifications = [];
  const emitted = [];
  const cleanup = [];
  const mounted = [];
  const access = {
    accessStatus: vue.ref('ready'),
    canManage: vue.ref(true),
    canPlay: vue.ref(false),
    canPlayLargeTables: vue.ref(false),
    botModes: vue.ref({ smart: false, regular: false }),
    botModeAvailableAt: vue.ref({}),
    botWaitHours: vue.ref({}),
    botsBusy: vue.ref(false),
    ownRoomID: vue.ref(),
    models: vue.ref([]),
    defaultModel: vue.ref('codex-chatgpt'),
    activeRoomID: vue.ref(activeRoomID),
    codexModels: vue.ref([]),
    refresh: async () => {},
    ...accessOverrides,
  };
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: false, messages });
  const filename = path.join(__dirname, '../src', file);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename });
  const component = evaluate(script.content, (id) => {
    if (id === '@vueuse/core') return { useMediaQuery: () => vue.ref(mobile) };
    if (id === 'vuetify/components')
      return {
        VDialog: {
          name: 'v-dialog',
          props: ['modelValue'],
          setup:
            (props, { slots }) =>
            () =>
              props.modelValue ? vue.h('section', slots.default?.()) : null,
        },
      };
    if (id === 'vue')
      return {
        ...vue,
        onBeforeUnmount: (callback) => cleanup.push(callback),
        onMounted: (callback) => mounted.push(callback),
      };
    if (id === 'vue-i18n') return { useI18n: () => i18n.global };
    if (id === 'vue-router')
      return {
        useRouter: () => ({
          beforeResolve: () => () => {},
          push: async (route) => {
            navigation.push(route);
          },
        }),
      };
    if (id === '@/helpers/open-room-route')
      return evaluate(fs.readFileSync(path.join(__dirname, '../src/helpers/open-room-route.ts'), 'utf8'));
    if (id === '@/store') return { useStore: () => ({ state: storeState }) };
    if (id === '@/router/paths') return { localizedPath: (url) => url, neutralRoomUrl: (url) => url };
    if (id === '@/helpers/event-bus') return { default: { emit: (...args) => notifications.push(args) } };
    if (id === '@/helpers/composables/useAiAccess') return { useAiAccess: () => access };
    if (id === '@/helpers/composables') return { useUserProfile: () => ({ userName: vue.ref('Host') }) };
    if (id === '@/api/socket')
      return {
        socket: {
          emit: (...args) => sent.push(args),
          timeout: () => ({
            emitWithAck: async (...args) => {
              sent.push(args);
              return acknowledge(...args);
            },
          }),
        },
      };
    if (id === '@/components/view/information/const')
      return evaluate(
        fs.readFileSync(path.join(__dirname, '../src/components/view/information/const.ts'), 'utf8'),
        (dependency) => (dependency === '@/plugins/i18n' ? { i18n } : require(dependency)),
      );
    if (id === '@avalon/types/room/ai-roles')
      return evaluate(fs.readFileSync(path.join(__dirname, '../../types/room/ai-roles.ts'), 'utf8'));
    if (id === '@avalon/types/room/ai-model')
      return evaluate(fs.readFileSync(path.join(__dirname, '../../types/room/ai-model.ts'), 'utf8'));
    if (id === '@/helpers/codex-pricing')
      return evaluate(fs.readFileSync(path.join(__dirname, '../src/helpers/codex-pricing.ts'), 'utf8'));
    if (id.endsWith('/PlayerIcon.vue'))
      return {
        __esModule: true,
        default: {
          name: 'PlayerIcon',
          props: ['icon', 'thumbnail'],
          setup: (props) => () => vue.h('span', { 'data-role-icon': props.icon }),
        },
      };
    if (id.endsWith('.vue'))
      return { __esModule: true, default: { name: path.basename(id, '.vue'), render: () => null } };
    throw Error(`Unexpected import: ${id}`);
  }).default;
  const template = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: filename,
    compilerOptions: {
      bindingMetadata: script.bindings,
      isCustomElement: (tag) => tag === 'v-btn' && !file.endsWith('StartPanel.vue'),
    },
  });
  assert.deepEqual(template.errors, []);
  const render = evaluate(template.code).render;
  const scope = vue.effectScope();
  const setupProps = vue.reactive(props);
  const state = scope.run(() => component.setup(setupProps, { expose() {}, emit: (...args) => emitted.push(args) }));
  access.models.value = [{ id: 'codex-chatgpt', label: 'Codex' }];
  await vue.nextTick();
  let tree;
  const renderHtml = () => {
    const app = vue.createSSRApp(
      {
        props: component.props,
        components: component.components,
        setup: () => state,
        render(...args) {
          tree = render.apply(this, args);
          return tree;
        },
      },
      props,
    );
    app.config.globalProperties.$t = i18n.global.t;
    app.component('v-icon', { render: () => null });
    app.component('v-select', {
      name: 'v-select',
      props: ['modelValue', 'items', 'disabled'],
      setup:
        (props, { slots, attrs }) =>
        () => {
          const item = (raw) => ({ raw, title: raw.title, value: raw.value });
          const selected = props.items.find((raw) => raw.value === props.modelValue);
          return vue.h('div', attrs, [
            ...(selected ? slots.selection?.({ item: item(selected) }) || [] : []),
            ...props.items.flatMap((raw) => slots.item?.({ item: item(raw), props: { title: raw.title } }) || []),
          ]);
        },
    });
    app.component('v-list-item', {
      props: ['title'],
      setup:
        (props, { slots }) =>
        () =>
          vue.h('div', [slots.prepend?.(), props.title]),
    });
    app.component('v-dialog', {
      name: 'v-dialog',
      props: ['modelValue'],
      setup:
        (props, { slots }) =>
        () =>
          props.modelValue ? vue.h('section', slots.default?.()) : null,
    });
    app.component('v-btn', {
      name: 'v-btn',
      setup:
        (_, { slots, attrs }) =>
        () =>
          vue.h('button', attrs, slots.default?.()),
    });
    app.component('RouterLink', {
      setup:
        (_, { slots }) =>
        () =>
          vue.h('a', slots.default?.()),
    });
    return renderToString(app);
  };
  const html = await renderHtml();
  mounted.forEach((callback) => callback());
  function nodes(type, node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [
      ...(node.type === type || node.type?.name === type || node.type?.__asyncResolved?.name === type ? [node] : []),
      ...(Array.isArray(node.children) ? node.children.flatMap((child) => nodes(type, child)) : []),
      ...((node.type === 'v-dialog' || node.type?.name === 'v-dialog') && node.children?.default
        ? node.children.default().flatMap((child) => nodes(type, child))
        : []),
    ];
  }
  return {
    html,
    nodes,
    sent,
    navigation,
    notifications,
    storeState,
    setupProps,
    emitted,
    access,
    render: renderHtml,
    stop: () => {
      cleanup.forEach((callback) => callback());
      scope.stop();
    },
  };
}

test('a bot button disabled by its parent cannot create a competing room', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    props: { disabled: true },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
  });
  t.after(room.stop);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, []);
});

test('mobile AI controls require confirmation before stopping and closing cancels it', async (t) => {
  const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
    mobile: true,
    props: { roomID: 'mobile-room', isHumanPlayer: true, ai: { status: 'running', publicBotGame: true } },
    acknowledge: async () => ({ ok: true }),
  });
  t.after(panel.stop);
  panel.nodes('summary')[0].props.onClick({ preventDefault() {} });
  await panel.render();
  const stopButton = () => panel.nodes('v-btn').find((node) => node.props?.['data-ai-stop'] !== undefined);
  stopButton().props.onClick();
  await panel.render();
  assert.deepEqual(panel.sent, [], 'opening confirmation must not stop the game');
  const dialog = () => panel.nodes('v-dialog')[0];
  dialog().props['onUpdate:modelValue'](false);
  await vue.nextTick();
  panel.nodes('summary')[0].props.onClick({ preventDefault() {} });
  await panel.render();
  assert.ok(!panel.nodes('v-btn').some((node) => node.props?.['data-ai-confirm-stop'] !== undefined));
  stopButton().props.onClick();
  await panel.render();
  await panel
    .nodes('v-btn')
    .find((node) => node.props?.['data-ai-confirm-stop'] !== undefined)
    .props.onClick();
  assert.deepEqual(panel.sent, [['controlAiRoom', 'mobile-room', 'stop']]);
});

test('only ready public bot room owners choose bots on the table; ordinary rooms keep human controls', async (t) => {
  for (const [owner, count, ai, visible] of [
    ['owner', 1, undefined, false],
    ['owner', 2, undefined, false],
    ['visitor', 1, undefined, false],
    ['owner', 5, { status: 'ready', publicBotGame: true, humanPlayerID: 'owner', title: 'Host vs4Bots' }, true],
    ['visitor', 5, { status: 'ready', publicBotGame: true, humanPlayerID: 'owner', title: 'Host vs4Bots' }, false],
    ['owner', 5, { status: 'running', botDifficulty: 'regular', humanPlayerID: 'owner' }, false],
    ['owner', 5, { status: 'running' }, false],
  ]) {
    const room = await fixture('components/view/panels/StartPanel.vue', {
      props: {
        roomState: {
          roomID: 'table',
          title: 'Host vs4Bots',
          leaderID: owner,
          stage: 'created',
          players: Array.from({ length: count }, (_, i) => ({ id: i ? `other-${i}` : 'owner' })),
          ai,
        },
      },
    });
    t.after(room.stop);
    assert.equal(room.nodes('BotGameChoices').length, visible ? 1 : 0);
    if (visible) {
      const choices = room.nodes('BotGameChoices')[0];
      assert.equal(choices.props.roomID, 'table');
      assert.equal(choices.props.title, 'Host vs4Bots');
    }
  }
});

test('players start a prepared bot room with either mode and the language selected on the table', async (t) => {
  for (const difficulty of ['smart', 'regular']) {
    const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
      props: { roomID: 'bot-room', title: 'Host vs4Bots' },
      locale: 'en',
      acknowledge: async () => ({ ok: true }),
      accessOverrides: {
        canManage: vue.ref(false),
        canPlay: vue.ref(true),
        botModes: vue.ref({ smart: true, regular: true }),
      },
    });
    t.after(room.stop);
    assert.ok(room.html.includes('Host vs4Bots'));
    assert.equal(room.nodes('select').length, 2);
    room.nodes('select')[0].props['onUpdate:modelValue']('ru');
    const play = room.nodes('v-btn').find((node) => node.props['data-bot-mode'] === difficulty);
    assert.ok(play, `missing ${difficulty} choice`);
    await play.props.onClick();
    assert.deepEqual(room.sent, [['startHumanAiRoom', 'bot-room', { difficulty, language: 'ru' }]]);
    assert.deepEqual(room.navigation, [], 'starting stays on the prepared table');
  }
});

test('bot discussion defaults to the interface language and falls back to English', async (t) => {
  for (const [locale, expected] of [
    ['en', 'en'],
    ['ru', 'ru'],
    ['zh_TW', 'zh-tw'],
    ['es', 'es'],
    ['vi', 'vi'],
  ]) {
    const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
      props: { roomID: 'bot-room', title: 'Host vs4Bots' },
      locale,
      accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
    });
    t.after(room.stop);
    const language = room.nodes('select')[0];
    assert.ok(language);
    assert.equal(language.dirs[0].value, expected);
    language.props['onUpdate:modelValue']('en');
    await room
      .nodes('v-btn')
      .find((node) => node.props['data-bot-mode'] === 'regular')
      .props.onClick();
    assert.deepEqual(room.sent, [['startHumanAiRoom', 'bot-room', { difficulty: 'regular', language: 'en' }]]);
  }
});

test('unavailable bot modes stay visible and cannot initiate a match', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room', title: 'Host vs4Bots' },
    accessOverrides: {
      canManage: vue.ref(false),
      canPlay: vue.ref(true),
      botModes: vue.ref({ smart: false, regular: true }),
    },
  });
  t.after(room.stop);
  const smart = room.nodes('v-btn').find((node) => node.props['data-bot-mode'] === 'smart');
  const regular = room.nodes('v-btn').find((node) => node.props['data-bot-mode'] === 'regular');
  assert.ok(smart?.props.disabled);
  assert.equal(regular?.props.disabled, false);
  await smart.props.onClick();
  assert.deepEqual(room.sent, []);
  room.access.botModes.value = { smart: false, regular: false };
  await room.render();
  assert.ok(
    room
      .nodes('v-btn')
      .filter((node) => node.props['data-bot-mode'])
      .every((node) => node.props.disabled),
  );
});

test('leaving preparation waits for cancellation before returning to the lobby, even without available bots', async (t) => {
  let finish;
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room', expiresAt: Date.now() + 90000 },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: false, regular: false }) },
    acknowledge: () => new Promise((resolve) => (finish = resolve)),
  });
  t.after(room.stop);
  const leave = room.nodes('v-btn').find((node) => node.props.class === 'bot-leave-button');
  assert.ok(leave, 'prepared table has a leave button');
  assert.equal(leave.props.disabled, false);
  const leaving = leave.props.onClick();
  await leave.props.onClick();
  await room.render();
  assert.deepEqual(room.sent, [['controlAiRoom', 'bot-room', 'stop']]);
  assert.deepEqual(room.navigation, [], 'stay until the server releases the slot');
  assert.ok(room.nodes('select')[0].props.disabled);
  assert.ok(room.nodes('v-btn').every((node) => node.props.disabled));
  finish({ ok: true });
  await leaving;
  assert.deepEqual(room.navigation, ['/']);
});

test('failed preparation cancellation stays in the room and allows retry without exposing server errors', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room' },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true) },
    acknowledge: async () => ({ error: 'AI room control in progress' }),
  });
  t.after(room.stop);
  const leave = room.nodes('v-btn').find((node) => node.props.class === 'bot-leave-button');
  assert.ok(leave);
  await leave.props.onClick();
  const html = await room.render();
  assert.deepEqual(room.navigation, []);
  assert.ok(html.includes('Не удалось покинуть игру. Попробуйте ещё раз.'));
  assert.ok(!html.includes('AI room control in progress'));
  assert.equal(room.nodes('v-btn').find((node) => node.props.class === 'bot-leave-button').props.disabled, false);
});

test('a network failure cancelling preparation keeps the player in the room', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room' },
    accessOverrides: { canPlay: vue.ref(true) },
    acknowledge: async () => {
      throw Error('ACK timeout');
    },
  });
  t.after(room.stop);
  const leave = room.nodes('v-btn').find((node) => node.props.class === 'bot-leave-button');
  assert.ok(leave);
  await leave.props.onClick();
  const html = await room.render();
  assert.deepEqual(room.navigation, []);
  assert.ok(html.includes(messages.en.aiArena.connectionError));
});

test('bot table locks language and prevents duplicate starts while the server acknowledges', async (t) => {
  let finish;
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room', title: 'Host vs4Bots' },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
    acknowledge: () => new Promise((resolve) => (finish = resolve)),
  });
  t.after(room.stop);
  const button = room.nodes('v-btn').find((node) => node.props['data-bot-mode'] === 'smart');
  const starting = button.props.onClick();
  await button.props.onClick();
  await room
    .nodes('v-btn')
    .find((node) => node.props.class === 'bot-leave-button')
    .props.onClick();
  await room.render();
  assert.deepEqual(room.sent, [['startHumanAiRoom', 'bot-room', { difficulty: 'smart', language: 'en' }]]);
  assert.ok(room.nodes('select')[0].props.disabled);
  assert.ok(room.nodes('v-btn').every((node) => node.props.disabled));
  finish({ ok: true });
  await starting;
});

test('an expired preparation deadline prevents a bot start and explains that the game ended', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    locale: 'ru',
    props: { roomID: 'bot-room', title: 'Host vs4Bots', expiresAt: Date.now() - 1000 },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
  });
  t.after(room.stop);
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.deepEqual(room.sent, []);
  const html = await room.render();
  assert.ok(html.includes('Время истекло. Партия завершена.'));
});

test('a reconnect preserves the prepared bot table and deadline while permission disables starts', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'bot-room', title: 'Host vs 4 Bots', expiresAt: Date.now() + 90000 },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
  });
  t.after(room.stop);
  room.access.canPlay.value = false;
  const html = await room.render();
  assert.ok(html.includes('Host vs 4 Bots'));
  assert.equal(room.nodes('BotGameTimer').length, 1, 'countdown remains on the table');
  assert.ok(room.nodes('v-btn').every((node) => node.props.disabled));
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.deepEqual(room.sent, []);
});

test('lobby players return to their reserved room even while new bot games are unavailable', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    accessOverrides: {
      canPlay: vue.ref(true),
      botModes: vue.ref({ smart: false, regular: false }),
      botModeAvailableAt: vue.ref({}),
      botWaitHours: vue.ref({}),
      botsBusy: vue.ref(false),
      ownRoomID: vue.ref('own-room'),
    },
  });
  t.after(room.stop);
  assert.equal(room.nodes('v-btn').length, 1);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'own-room' } }]);
});

test('prepared public bot games keep mode launch on the table without editable Codex controls', async (t) => {
  for (const isHumanPlayer of [true, false]) {
    const room = await fixture('components/view/panels/AiRoomPanel.vue', {
      props: {
        roomID: 'own-room',
        isHumanPlayer,
        ai: {
          model: 'codex-chatgpt',
          publicBotGame: true,
          status: 'ready',
          playerCount: 5,
          humanPlayerID: 'owner',
        },
      },
      accessOverrides: { canManage: vue.ref(false) },
      acknowledge: async () => ({ ok: true }),
    });
    t.after(room.stop);
    assert.equal(room.nodes('select').length, 0);
    const start = room.nodes('v-btn').find((node) => String(node.children).includes('Start AI match'));
    assert.equal(start, undefined, 'public players start by choosing their mode on the table');
  }
});

test('native language selection sends the chosen language when creating an AI room', async (t) => {
  const room = await fixture('pages/lobby/AiRoomButton.vue');
  t.after(room.stop);
  const selects = room.nodes('select');
  assert.equal(selects.length, 2, 'new-room controls need discussion language and player count selects');
  const language = selects[0];
  assert.deepEqual(
    Array.from(
      room.html.match(/<select[\s\S]*?<\/select>/)[0].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g),
      ([, value, title]) => [value, title],
    ),
    [
      ['en', 'English'],
      ['ru', 'Русский'],
      ['zh-tw', '繁體中文（台灣）'],
      ['es', 'Español'],
      ['vi', 'Tiếng Việt'],
    ],
  );
  assert.match(room.html, /<label[^>]*><span>Discussion language<\/span>\s*<select/);
  language.props['onUpdate:modelValue']('zh-tw');
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, [['createAiRoom', { model: 'codex-chatgpt', language: 'zh-tw', playerCount: 7 }]]);
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
    const count = room.nodes('select')[1];
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
  assert.equal(room.nodes('select').length, 2);
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
  const count = room.nodes('select')[1];
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
      props: {
        roomID: 'room',
        playerCount: seats,
        ai: { model: 'codex-chatgpt', status: 'ready', playerCount: saved },
      },
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
    ['es', 'Español'],
    ['vi', 'Tiếng Việt'],
  ]) {
    const room = await fixture('components/view/panels/AiRoomPanel.vue', {
      props: { roomID: 'room', ai: { model: 'codex-chatgpt', status: 'ready', language } },
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
      props: { roomID: 'room', ai: { model: 'codex-chatgpt', status: 'ready', language: 'ru' } },
    });
    t.after(room.stop);
    t.after(panel.stop);
    assert.equal(room.nodes('select').length, 2);
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
    ['es', 'Español'],
    ['vi', 'Tiếng Việt'],
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
    assert.ok(room.html.includes(`<span class="ai-language">${label}</span>`), `wrong lobby badge for ${language}`);
  }
});

test('administrator owner joins from the ready panel; visitors and launched games have no join control', async (t) => {
  const props = { roomID: 'mixed', canJoin: true, ai: { model: 'codex-chatgpt', status: 'ready', playerCount: 7 } };
  const room = await fixture('components/view/panels/AiRoomPanel.vue', {
    props,
    acknowledge: async () => ({ ok: true }),
  });
  t.after(room.stop);
  const join = room.nodes('v-btn').find((node) => String(node.children).includes('Play with AI'));
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
    assert.ok(!panel.html.includes('Play with AI'));
  }
});

test('mixed game summary counts the bots separately from the single human', async (t) => {
  const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
    locale: 'ru',
    props: { roomID: 'mixed', ai: { status: 'running', playerCount: 7, humanPlayerID: 'owner' } },
  });
  t.after(panel.stop);
  assert.ok(panel.html.includes('Игроков: 1 · Ботов: 6'));
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
  assert.ok(panel.html.includes('Play with AI'));
  panel.access.canManage.value = false;
  assert.ok(!(await panel.render()).includes('Play with AI'), 'server permission is still required');
  roomState.value.leaderID = 'another-owner';
  assert.equal(canJoin.value, false);
});

for (const isHumanPlayer of [true, false]) {
  test(`discussion prompt is visible outside collapsed controls only for human: ${isHumanPlayer}`, async (t) => {
    const panel = await fixture('components/view/panels/AiRoomPanel.vue', {
      locale: 'ru',
      props: {
        roomID: 'mixed-room',
        isHumanPlayer,
        ai: { status: 'running', humanPlayerID: 'admin', waitingForDiscussion: true },
      },
      acknowledge: async () => ({ ok: true }),
    });
    t.after(panel.stop);
    if (isHumanPlayer) {
      assert.match(panel.html, /Ваше слово/);
      assert.ok(panel.html.indexOf('Ваше слово') < panel.html.indexOf('<details'));
      await panel.nodes('v-btn')[0].props.onClick();
      assert.deepEqual(panel.sent, [['finishAiDiscussion', 'mixed-room']]);
    } else {
      assert.doesNotMatch(panel.html, /Ваше слово|Передать слово/);
    }
  });
}

test('smart bot availability shows fractional hours to the quota reset and no estimate for occupied bots', async (t) => {
  t.mock.method(Date, 'now', () => 1000000000);
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    locale: 'ru',
    props: { roomID: 'quota-wait' },
    accessOverrides: { canPlay: vue.ref(true), botWaitHours: vue.ref({ smart: 2.4 }) },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('2,4'), room.html);
  assert.ok(room.html.includes('ч'), room.html);
  room.access.botsBusy.value = true;
  assert.ok(!(await room.render()).includes('2,4'), 'occupied slots have no promised release time');
});

test('human action countdown separates normal turn time from the live shared reserve', async (t) => {
  let now = 1000000;
  let tick;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', (callback) => {
    tick = callback;
    return 1;
  });
  t.mock.method(globalThis, 'clearInterval', () => {});
  const room = await fixture('components/view/board/modules/BotGameTimer.vue', {
    locale: 'ru',
    props: { expiresAt: 1390000, baseExpiresAt: 1090000, timeBankMs: 300000, phase: 'action' },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Твой ход: 90 с'), room.html);
  assert.ok(room.html.includes('Общий запас: 300 с'), room.html);
  now = 1120000;
  tick();
  const html = await room.render();
  assert.ok(html.includes('Расходуется запас: 270 с'), html);
  assert.ok(html.includes('Общий запас: 270 с'), html);
});

test('discussion countdown shows the shared reserve as it is spent', async (t) => {
  let now = 1000000;
  let tick;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', (callback) => {
    tick = callback;
    return 1;
  });
  t.mock.method(globalThis, 'clearInterval', () => {});
  const room = await fixture('components/view/board/modules/BotGameTimer.vue', {
    locale: 'ru',
    props: { expiresAt: 1390000, baseExpiresAt: 1090000, phase: 'action', discussion: true, timeBankMs: 300000 },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Ваше слово: 90 с'), room.html);
  assert.ok(room.html.includes('слово передаётся автоматически'), room.html);
  assert.ok(room.html.includes('Общий запас: 300 с'), room.html);
  now = 1120000;
  tick();
  const html = await room.render();
  assert.ok(html.includes('Расходуется запас: 270 с'), html);
  assert.ok(html.includes('Общий запас: 270 с'), html);
});

test('beginner table hides settings and starts only regular five-seat play', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'beginner-room', beginner: true },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true, beginner: true }) },
  });
  t.after(room.stop);
  assert.equal(room.nodes('select').length, 0);
  assert.equal(room.nodes('v-btn').filter((node) => node.props['data-bot-mode']).length, 1);
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.deepEqual(room.sent, [['startHumanAiRoom', 'beginner-room', { difficulty: 'regular', language: 'ru' }]]);
});

test('standard table offers four sizes and locks premium seats', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'standard-room' },
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(false),
      botModes: vue.ref({ smart: true, regular: true }),
    },
  });
  t.after(room.stop);
  assert.equal(room.nodes('select').length, 2);
  const count = room.nodes('select')[1];
  assert.deepEqual(
    count.children.filter((n) => n.type === 'option').map((n) => [n.props.value, !!n.props.disabled]),
    [
      [5, false],
      [6, false],
      [7, true],
      [8, true],
    ],
  );
  count.props['onUpdate:modelValue'](6);
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.deepEqual(room.sent, [
    ['startHumanAiRoom', 'standard-room', { difficulty: 'regular', language: 'en', playerCount: 6 }],
  ]);
});

test('AI lobby cards show the actual mixed table size and saved beginner mode', async (t) => {
  const room = await fixture('pages/lobby/LobbyRoom.vue', {
    locale: 'ru',
    props: {
      game: {
        uuid: 'beginner',
        hostID: 'host',
        ai: true,
        aiTitle: 'Alice vs 5 Bots',
        aiBeginner: true,
        aiStatus: 'finished',
        players: 6,
        state: 'started',
        options: { roles: {}, addons: {} },
        createAt: '2026-10-11T12:00:00Z',
        result: { winner: 'evil' },
      },
    },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('1 человек + 5 ботов'));
  assert.ok(room.html.includes('С подсказками'));
  assert.ok(!room.html.includes('players-amount'), 'roster replaces the redundant AI player count');
  assert.ok(room.html.includes('Победа зла'));
  assert.ok(room.html.includes('Открыть'));
  assert.ok(!room.html.includes('<i aria-hidden="true">'), 'finished cards have no live dot');
});

test('AI lobby shows saved smart difficulty and a live-only indicator', async (t) => {
  const room = await fixture('pages/lobby/LobbyRoom.vue', {
    locale: 'ru',
    props: {
      game: {
        uuid: 'smart',
        hostID: 'host',
        ai: true,
        aiTitle: 'Alice vs 7 Bots',
        aiBotDifficulty: 'smart',
        aiStatus: 'running',
        players: 8,
        state: 'started',
        options: { roles: {}, addons: {} },
        createAt: '2026-10-11T12:00:00Z',
      },
    },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Умные'));
  assert.ok(room.html.includes('1 человек + 7 ботов'));
  assert.ok(room.html.includes('<i aria-hidden="true">'));
  assert.ok(room.html.includes('Смотреть'));
});

test('prepared table keeps settings out of the main view and retains them for launch after closing', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'compact-room' },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ smart: true, regular: true }),
    },
    acknowledge: async () => ({ ok: true }),
  });
  t.after(room.stop);
  assert.ok(!room.html.includes('<select'), 'settings do not clutter the table');
  const settings = room.nodes('button').find((node) => node.props['data-bot-settings'] !== undefined);
  assert.ok(settings, 'table offers an explicit settings action');
  settings.props.onClick();
  const openHtml = await room.render();
  assert.ok(openHtml.includes('<select'), 'settings open with editable values');
  room.nodes('select')[0].props['onUpdate:modelValue']('en');
  room.nodes('select')[1].props['onUpdate:modelValue'](6);
  room
    .nodes('button')
    .find((node) => node.props['data-bot-settings-done'] !== undefined)
    .props.onClick();
  const closedHtml = await room.render();
  assert.ok(!closedHtml.includes('<select'));
  assert.ok(closedHtml.includes('English'));
  assert.ok(closedHtml.includes('6 игроков'));
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.deepEqual(room.sent, [
    ['startHumanAiRoom', 'compact-room', { difficulty: 'regular', language: 'en', playerCount: 6 }],
  ]);
});

test('compact preparation countdown shows remaining launch time and reaches zero without an action prompt', async (t) => {
  let now = 1000000;
  let tick;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'setInterval', (callback) => {
    tick = callback;
    return 1;
  });
  t.mock.method(globalThis, 'clearInterval', () => {});
  const room = await fixture('components/view/board/modules/BotGameTimer.vue', {
    locale: 'ru',
    props: { expiresAt: 1070000, phase: 'preparation', compact: true },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('На запуск 1:10'));
  assert.ok(!room.html.includes('<details'));
  assert.ok(!room.html.includes('Твой ход'));
  now = 1061000;
  tick();
  assert.ok((await room.render()).includes('На запуск 0:09'));
  now = 1080000;
  tick();
  assert.ok((await room.render()).includes('На запуск 0:00'));
});

test('friend preparation blocks launch until the second human joins', async (t) => {
  const props = vue.reactive({ roomID: 'friends', withFriend: true, humanCount: 1 });
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    locale: 'ru',
    props,
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
  });
  t.after(room.stop);
  assert.match(room.html, /Игроков: 2 · Ботов: 3/);
  assert.match(room.html, /Свободных мест: 1/);
  const button = room.nodes('v-btn').find((node) => node.props?.['data-bot-mode'] === 'regular');
  assert.equal(button.props.disabled, true);
  await button.props.onClick();
  assert.deepEqual(room.sent, []);
  props.humanCount = 2;
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => node.props?.['data-bot-mode'] === 'regular')
    .props.onClick();
  assert.equal(room.sent[0][0], 'startHumanAiRoom');
});

test('only the current human speaker gets the pass button in a friend game', async (t) => {
  const room = await fixture('components/view/panels/AiRoomPanel.vue', {
    locale: 'ru',
    props: {
      roomID: 'friends',
      isHumanPlayer: true,
      isDiscussionPlayer: false,
      ai: { status: 'running', withFriend: true, humanPlayerIDs: ['owner', 'friend'], waitingForDiscussion: true },
    },
  });
  t.after(room.stop);
  assert.doesNotMatch(room.html, /Ваше слово|Передать слово/);
});

test('Play with AI remains visible and opens setup when every bot is unavailable', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    accessOverrides: { canPlay: vue.ref(false), botModes: vue.ref({ regular: false, smart: false }) },
  });
  t.after(room.stop);
  assert.equal(room.nodes('v-btn').length, 1);
  assert.equal(!!room.nodes('v-btn')[0].props.disabled, false);
  await room.nodes('v-btn')[0].props.onClick();
  await room.render();
  const setup = room.nodes('BotGameSetup')[0];
  assert.ok(setup);
  assert.equal(setup.props.modelValue, true);
  assert.deepEqual(room.sent, [], 'opening settings must not reserve or create a room');
});

test('setup defaults to strong bots and falls back to regular bots when access loads', async (t) => {
  for (const withFriend of [false, true]) {
    for (const smart of [false, true]) {
      const room = await fixture('pages/lobby/BotGameSetup.vue', {
        props: { modelValue: true, withFriend },
        accessOverrides: { accessStatus: vue.ref('loading') },
      });
      t.after(room.stop);
      assert.match(
        room.nodes('label').find((node) => node.children.some?.((child) => child.props?.value === 'smart')).props.class,
        /selected/,
      );
      room.access.canPlay.value = true;
      room.access.botModes.value = { smart, regular: true };
      room.access.accessStatus.value = 'ready';
      await room.render();
      await room
        .nodes('v-btn')
        .find((node) => 'data-create-bot-game' in node.props)
        .props.onClick();
      assert.equal(room.sent[0][1].difficulty, smart ? 'smart' : 'regular');
    }
  }
});

test('setup preserves a manual regular choice when strong bots are available', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  room
    .nodes('input')
    .find((node) => node.props.value === 'regular')
    .props['onUpdate:modelValue']('regular');
  room.access.botModes.value = { regular: true, smart: true };
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.equal(room.sent[0][1].difficulty, 'regular');
});

test('setup creates the chosen friend table without launching inference', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true, withFriend: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: true }),
    },
  });
  t.after(room.stop);
  room
    .nodes('input')
    .find((node) => node.props.value === 'smart')
    .props['onUpdate:modelValue']('smart');
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 8)
    .props.onClick();
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-create-bot-game'] !== undefined)
    .props.onClick();
  assert.deepEqual(room.sent, [
    ['createHumanAiRoom', { beginner: false, withFriend: true, difficulty: 'smart', language: 'ru', playerCount: 8 }],
  ]);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'created-room' } }]);
});

test('setup omits availability-checking text while access loads', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { accessStatus: vue.ref('loading') },
  });
  t.after(room.stop);
  assert.doesNotMatch(room.html, /Проверяем доступность|сейчас недоступны/);
  assert.equal(room.nodes('v-btn').find((node) => 'data-create-bot-game' in node.props).props.disabled, true);
});

test('setup locks Premium seats and unavailable bots while keeping settings visible', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: false }),
      botWaitHours: vue.ref({ smart: 2 }),
    },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Сильные боты сейчас недоступны'));
  assert.ok(room.html.includes('Будут доступны через 2 ч.'));
  assert.ok(!room.html.includes('Проверить снова'));
  assert.equal(room.nodes('input').find((node) => node.props.value === 'smart').props.disabled, true);
  const seats = room.nodes('button').filter((node) => node.props['data-player-count']);
  assert.deepEqual(
    seats.map((node) => [node.props['data-player-count'], !!node.props.disabled]),
    [
      [5, false],
      [6, false],
      [7, true],
      [8, true],
    ],
  );
  assert.equal(room.nodes('v-select').length, 2);
});

test('setup explains the occupied slot without a recovery promise and cannot create', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      botsBusy: vue.ref(true),
      botWaitHours: vue.ref({ regular: 2, smart: 2 }),
    },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Они уже играют другую партию'));
  assert.ok(!room.html.includes('Будут доступны'));
  const create = room.nodes('v-btn').find((node) => node.props['data-create-bot-game'] !== undefined);
  assert.equal(create.props.disabled, true);
  await create.props.onClick();
  assert.deepEqual(room.sent, []);
});

test('guest can open setup and reaches authentication without creating a room', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    profile: null,
  });
  t.after(room.stop);
  const create = room.nodes('v-btn').find((node) => node.props['data-create-bot-game'] !== undefined);
  assert.equal(!!create.props.disabled, false);
  await create.props.onClick();
  assert.deepEqual(room.sent, []);
  assert.equal(room.notifications.length, 1);
  assert.equal(room.notifications[0][0], 'openAuthModal');
  assert.equal(typeof room.notifications[0][1], 'function');
});

test('setup blocks duplicate creation and ignores navigation after unmount', async () => {
  let finish;
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
    acknowledge: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const create = room.nodes('v-btn').find((node) => node.props['data-create-bot-game'] !== undefined);
  const pending = create.props.onClick();
  await create.props.onClick();
  assert.equal(room.sent.length, 1);
  room.stop();
  finish({ roomID: 'late-room' });
  await pending;
  assert.deepEqual(room.navigation, []);
});

test('created room uses the saved setup after reload and waits for the friend', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: {
      roomID: 'saved-room',
      difficulty: 'smart',
      language: 'ru',
      playerCount: 8,
      withFriend: true,
      humanCount: 1,
    },
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: true }),
    },
  });
  t.after(room.stop);
  assert.equal(room.nodes('select').length, 0);
  assert.equal(
    room.nodes('v-btn').find((node) => node.props['data-prepared-start'] !== undefined).props.disabled,
    true,
  );
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-prepared-start'] !== undefined)
    .props.onClick();
  assert.deepEqual(room.sent, []);
});

test('saved solo setup starts with the persisted language, size and difficulty', async (t) => {
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'saved-room', difficulty: 'smart', language: 'ru', playerCount: 8 },
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: true }),
    },
  });
  t.after(room.stop);
  await room
    .nodes('v-btn')
    .find((node) => node.props['data-prepared-start'] !== undefined)
    .props.onClick();
  assert.deepEqual(room.sent, [
    ['startHumanAiRoom', 'saved-room', { difficulty: 'smart', language: 'ru', playerCount: 8 }],
  ]);
});

test('setup can resume a room discovered after opening even when new games are unavailable', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    accessOverrides: { canPlay: vue.ref(true), ownRoomID: vue.ref('running-room') },
  });
  t.after(room.stop);
  const create = room.nodes('v-btn').find((node) => node.props['data-create-bot-game'] !== undefined);
  assert.equal(create.props.disabled, false);
  await create.props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'running-room' } }]);
});

test('setup describes the human and bot roster in player-facing language', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Игроков: 1 · Ботов: 4'));
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 6)
    .props.onClick();
  const html = await room.render();
  assert.ok(html.includes('Игроков: 1 · Ботов: 5'));
});

test('expired preparation offers a return to the lobby instead of an empty action panel', async (t) => {
  const room = await fixture('components/view/panels/StartPanel.vue', {
    locale: 'ru',
    props: {
      roomState: {
        roomID: 'expired-room',
        leaderID: 'owner',
        stage: 'locked',
        players: [{ id: 'owner' }],
        ai: { publicBotGame: true, status: 'stopped' },
      },
    },
  });
  t.after(room.stop);
  assert.ok(room.html.includes('Время подготовки истекло'));
  assert.ok(room.nodes('v-btn').some((node) => node.props.to === '/ru/' || node.props.to === '/'));
});

test('only the owner gets a remove-player action for the occupied friend seat', async (t) => {
  const state = {
    roomID: 'friend-room',
    leaderID: 'owner',
    stage: 'locked',
    players: [{ id: 'owner' }, { id: 'friend' }],
    ai: { publicBotGame: true, withFriend: true, status: 'ready', humanPlayerIDs: ['owner', 'friend'] },
  };
  const owner = await fixture('components/view/panels/StartPanel.vue', { locale: 'ru', props: { roomState: state } });
  t.after(owner.stop);
  const remove = owner.nodes('v-btn').find((node) => 'data-kick-friend' in node.props);
  assert.ok(remove);
  assert.ok(owner.html.includes('Удалить игрока'));
  remove.props.onClick();
  assert.deepEqual(owner.sent, [['kickPlayer', 'friend-room', 'friend']]);
  const guest = await fixture('components/view/panels/StartPanel.vue', {
    profile: { id: 'friend' },
    props: { roomState: state },
  });
  t.after(guest.stop);
  assert.ok(!guest.nodes('v-btn').some((node) => 'data-kick-friend' in node.props));
  const empty = await fixture('components/view/panels/StartPanel.vue', {
    props: { roomState: { ...state, ai: { ...state.ai, humanPlayerIDs: ['owner'] } } },
  });
  t.after(empty.stop);
  assert.ok(!empty.nodes('v-btn').some((node) => 'data-kick-friend' in node.props));
});

test('lobby shows the actual friend-game roster and its empty seat', async (t) => {
  const game = {
    uuid: 'friend-room',
    hostID: 'host',
    ai: true,
    aiTitle: 'Owner vs 5 Bots',
    aiStatus: 'ready',
    players: 7,
    state: 'locked',
    options: { roles: {}, addons: {} },
    createAt: '2026-10-12T00:00:00Z',
    aiBotCount: 5,
  };
  const waiting = await fixture('pages/lobby/LobbyRoom.vue', {
    props: { game: { ...game, aiHumanCount: 1, aiOpenSeats: 1 } },
  });
  t.after(waiting.stop);
  assert.ok(waiting.html.includes('1 human + 5 bots'));
  assert.ok(waiting.html.includes('Friend’s seat open'));
  assert.ok(!waiting.html.includes('6 bots'));
  const joined = await fixture('pages/lobby/LobbyRoom.vue', {
    props: { game: { ...game, aiHumanCount: 2, aiOpenSeats: 0 } },
  });
  t.after(joined.stop);
  assert.ok(joined.html.includes('2 humans + 5 bots'));
  assert.ok(!joined.html.includes('Friend’s seat open'));
});

test('first game can be prepared and launched while regular bots are unavailable', async (t) => {
  const accessOverrides = {
    canPlay: vue.ref(true),
    botModes: vue.ref({ regular: false, smart: false, beginner: true }),
  };
  const setup = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true, beginner: true },
    locale: 'ru',
    accessOverrides,
  });
  t.after(setup.stop);
  assert.equal(setup.nodes('input').find((node) => node.props.value === 'beginner').props.disabled, false);
  const create = setup.nodes('v-btn').find((node) => 'data-create-bot-game' in node.props);
  assert.equal(create.props.disabled, false);
  assert.ok(!setup.html.includes('Все боты сейчас недоступны'));
  await create.props.onClick();
  assert.deepEqual(setup.sent, [
    ['createHumanAiRoom', { beginner: true, withFriend: false, difficulty: 'regular', language: 'ru', playerCount: 5 }],
  ]);
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props: { roomID: 'first', beginner: true, difficulty: 'regular', language: 'ru', playerCount: 5 },
    accessOverrides,
    acknowledge: async () => ({ ok: true }),
  });
  t.after(room.stop);
  const start = room.nodes('v-btn').find((node) => 'data-prepared-start' in node.props);
  assert.equal(start.props.disabled, false);
  await start.props.onClick();
  assert.deepEqual(room.sent, [['startHumanAiRoom', 'first', { difficulty: 'regular', language: 'ru' }]]);
});

test('setup recovery belongs to the displayed unavailable mode and excludes beginner in friend play', async (t) => {
  const solo = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      botModes: vue.ref({ smart: false, regular: false, beginner: true }),
      botWaitHours: vue.ref({ smart: 144, regular: 4 }),
    },
  });
  t.after(solo.stop);
  assert.ok(solo.html.includes('Сильные боты сейчас недоступны'));
  assert.ok(solo.html.includes('Будут доступны через 144 ч.'));
  const friend = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true, withFriend: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      botModes: vue.ref({ smart: false, regular: false, beginner: false }),
      botWaitHours: vue.ref({ smart: 144, regular: 4, beginner: 1 }),
    },
  });
  t.after(friend.stop);
  assert.ok(friend.html.includes('Будут доступны через 4 ч.'));
});

test('three-human setup reserves two friends and sends the chosen format', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  room
    .nodes('button')
    .find((node) => node.props['aria-pressed'] === false)
    .props.onClick();
  await room.render();
  const seats = room.nodes('select').find((node) => 'data-human-seats' in node.props);
  assert.ok(seats, 'friends format offers a human player count');
  seats.props['onUpdate:modelValue'](3);
  const html = await room.render();
  assert.match(html, /Игроков: 3 · Ботов: 2/);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.deepEqual(room.sent, [
    [
      'createHumanAiRoom',
      {
        beginner: false,
        withFriend: true,
        humanSeats: 3,
        difficulty: 'smart',
        language: 'ru',
        playerCount: 5,
      },
    ],
  ]);
});

test('three-human preparation waits for both friends', async (t) => {
  const props = vue.reactive({
    roomID: 'three',
    difficulty: 'regular',
    withFriend: true,
    humanSeats: 3,
    humanCount: 2,
  });
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props,
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  let start = room.nodes('v-btn').find((node) => 'data-prepared-start' in node.props);
  assert.equal(start.props.disabled, true);
  await start.props.onClick();
  assert.deepEqual(room.sent, []);
  props.humanCount = 3;
  await room.render();
  assert.match(room.html, /Игроков: 3 · Ботов: 2/);
  start = room.nodes('v-btn').find((node) => 'data-prepared-start' in node.props);
  assert.equal(start.props.disabled, false);
  await start.props.onClick();
  assert.equal(room.sent[0][0], 'startHumanAiRoom');
});

test('friends waiting message counts missing humans as players join', async (t) => {
  const props = vue.reactive({
    roomID: 'friends',
    difficulty: 'regular',
    withFriend: true,
    humanSeats: 3,
    humanCount: 1,
  });
  const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
    props,
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  assert.match(room.html, /Свободных мест: 2/);
  props.humanCount = 2;
  assert.match(await room.render(), /Свободных мест: 1/);
  props.humanCount = 3;
  const html = await room.render();
  assert.doesNotMatch(html, /Свободных мест:/);
  assert.equal(room.nodes('v-btn').find((node) => 'data-prepared-start' in node.props).props.disabled, false);
});

test('solo setup sends the selected role and resets roles absent from a new table size', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: true }),
    },
  });
  t.after(room.stop);
  const select = () => room.nodes('v-select').find((node) => 'data-solo-role' in node.props);
  assert.ok(select());
  assert.match(room.html, /Случайная роль/);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 7)
    .props.onClick();
  await room.render();
  select().props['onUpdate:modelValue']('oberon');
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 8)
    .props.onClick();
  await room.render();
  assert.equal(select().props.modelValue, '');
  assert.equal(
    select().props.items.some((item) => item.value === 'oberon'),
    false,
  );
  select().props['onUpdate:modelValue']('minion');
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.equal(room.sent[0][1].role, 'minion');
  assert.equal(room.sent[0][1].playerCount, 8);
});

test('friend setup hides the solo role selector and omits the previously selected role', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  room
    .nodes('v-select')
    .find((node) => 'data-solo-role' in node.props)
    .props['onUpdate:modelValue']('merlin');
  room
    .nodes('button')
    .find((node) => node.props['aria-pressed'] === false)
    .props.onClick();
  await room.render();
  assert.equal(
    room.nodes('v-select').some((node) => 'data-solo-role' in node.props),
    false,
  );
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.equal(room.sent[0][1].withFriend, true);
  assert.equal('role' in room.sent[0][1], false);
});

test('setup role and language choices include artwork in options and selected values', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true }) },
  });
  t.after(room.stop);
  const role = room.nodes('v-select').find((node) => 'data-solo-role' in node.props);
  const language = room.nodes('v-select').find((node) => 'data-bot-language' in node.props);
  assert.ok(role, 'role uses a select that supports images');
  assert.ok(language, 'language uses a select that supports flags');
  assert.deepEqual(
    language.props.items.map((item) => item.value),
    ['en', 'ru', 'zh-tw', 'es', 'vi'],
  );
  assert.ok(language.props.items.every((item) => item.flag.endsWith('.svg')));
  assert.match(room.html, /data-role-icon="unknown"/);
  assert.match(room.html, /data-role-icon="merlin"/);
  assert.match(room.html, /src="\/flags\/en.svg"/);
  role.props['onUpdate:modelValue']('merlin');
  language.props['onUpdate:modelValue']('ru');
  const html = await room.render();
  assert.match(html, /data-role-icon="merlin"/);
  assert.match(html, /src="\/flags\/ru.svg"/);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.equal(room.sent[0][1].role, 'merlin');
  assert.equal(room.sent[0][1].language, 'ru');
});

test('wiki play block exposes the same direct AI setup button as the lobby', async (t) => {
  const room = await fixture('components/view/information/WikiPlayCta.vue', { locale: 'ru' });
  t.after(room.stop);
  const button = room.nodes('BotRoomButton')[0];
  assert.ok(button, 'wiki reuses the bot setup and active-room navigation flow');
  assert.equal(button.props.variant, 'outlined');
});

test('guest AI creation resumes once access loads and retains the chosen settings', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    profile: null,
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(false),
      botModes: vue.ref({ regular: false, smart: false }),
    },
  });
  t.after(room.stop);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 6)
    .props.onClick();
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.deepEqual(room.sent, []);
  const resume = room.notifications.find(([event]) => event === 'openAuthModal')[1];
  assert.equal(typeof resume, 'function');
  room.storeState.profile = { id: 'new-user' };
  room.access.accessStatus.value = 'loading';
  await resume();
  await vue.nextTick();
  assert.deepEqual(room.sent, []);
  room.access.canPlay.value = true;
  room.access.botModes.value = { regular: true, smart: false };
  room.access.accessStatus.value = 'ready';
  await room.render();
  assert.deepEqual(room.sent, [
    [
      'createHumanAiRoom',
      {
        beginner: false,
        withFriend: false,
        difficulty: 'regular',
        language: 'ru',
        playerCount: 6,
      },
    ],
  ]);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'created-room' } }]);
});

test('unmounting AI setup while access loads cancels pending creation', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', { profile: null, props: { modelValue: true } });
  t.after(room.stop);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  const resume = room.notifications.find(([event]) => event === 'openAuthModal')[1];
  assert.equal(typeof resume, 'function');
  room.storeState.profile = { id: 'new-user' };
  room.access.accessStatus.value = 'loading';
  await resume();
  await vue.nextTick();
  room.stop();
  room.access.canPlay.value = true;
  room.access.botModes.value = { regular: true, smart: true };
  room.access.accessStatus.value = 'ready';
  await vue.nextTick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, []);
});

test('closing and reopening AI setup does not revive pending creation', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', { profile: null, props: { modelValue: true } });
  t.after(room.stop);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  const resume = room.notifications.find(([event]) => event === 'openAuthModal')[1];
  room.storeState.profile = { id: 'new-user' };
  room.access.accessStatus.value = 'loading';
  await resume();
  await vue.nextTick();
  room.setupProps.modelValue = false;
  await vue.nextTick();
  room.setupProps.modelValue = true;
  await vue.nextTick();
  room.access.canPlay.value = true;
  room.access.botModes.value = { regular: true, smart: true };
  room.access.accessStatus.value = 'ready';
  await vue.nextTick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, []);
});

test('AI setup reports creation failures to the welcome funnel', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true }) },
    acknowledge: async () => ({ error: 'requestFailed' }),
  });
  t.after(room.stop);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.ok(
    room.emitted.some(([event, message]) => event === 'error' && typeof message === 'string' && message.length),
  );
});

test('AI button forwards setup failures through its existing error event', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue');
  t.after(room.stop);
  await room.nodes('v-btn')[0].props.onClick();
  await room.render();
  const setup = room.nodes('BotGameSetup')[0];
  assert.equal(typeof setup.props.onError, 'function');
  setup.props.onError('localized failure');
  assert.ok(room.emitted.some(([event, message]) => event === 'error' && message === 'localized failure'));
});

test('friends can reserve every seat except one and shrink to a valid roster', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true, withFriend: true },
    locale: 'ru',
    accessOverrides: {
      canPlay: vue.ref(true),
      canPlayLargeTables: vue.ref(true),
      botModes: vue.ref({ regular: true, smart: true }),
    },
  });
  t.after(room.stop);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 8)
    .props.onClick();
  await room.render();
  const select = () => room.nodes('select').find((node) => 'data-human-seats' in node.props);
  assert.deepEqual(
    room.nodes('option').map((node) => node.props.value),
    [2, 3, 4, 5, 6, 7],
  );
  select().props['onUpdate:modelValue'](7);
  assert.match(await room.render(), /Игроков: 7 · Ботов: 1/);
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.equal(room.sent[0][1].humanSeats, 7);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 5)
    .props.onClick();
  await room.render();
  assert.deepEqual(
    room.nodes('option').map((node) => node.props.value),
    [2, 3, 4],
  );
  assert.match(await room.render(), /Игроков: 4 · Ботов: 1/);
});

test('table preview shows exact role counts and updates with table size', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlayLargeTables: vue.ref(true) },
  });
  t.after(room.stop);
  const roles = () =>
    room
      .nodes('span')
      .filter((node) => node.props && 'data-table-role' in node.props)
      .map((node) => [node.props['data-table-role'], node.props['data-role-count']]);
  assert.deepEqual(roles(), [
    ['merlin', 1],
    ['percival', 1],
    ['servant', 1],
    ['mordred', 1],
    ['morgana', 1],
  ]);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 8)
    .props.onClick();
  await room.render();
  assert.deepEqual(roles(), [
    ['merlin', 1],
    ['percival', 1],
    ['servant', 3],
    ['mordred', 1],
    ['morgana', 1],
    ['minion', 1],
  ]);
});

test('switching first game to friends selects a playable standard mode', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true, beginner: true },
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true, smart: true, beginner: true }) },
  });
  t.after(room.stop);
  room
    .nodes('button')
    .find((node) => node.props['aria-pressed'] === false)
    .props.onClick();
  await room.render();
  const create = room.nodes('v-btn').find((node) => 'data-create-bot-game' in node.props);
  assert.equal(create.props.disabled, false);
  await create.props.onClick();
  assert.equal(room.sent[0][1].beginner, false);
});

test('setup preview shows Lady of the Lake only for seven and eight seats', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    accessOverrides: { canPlayLargeTables: vue.ref(true) },
  });
  t.after(room.stop);
  for (const count of [5, 6, 7, 8, 5]) {
    room
      .nodes('button')
      .find((node) => node.props['data-player-count'] === count)
      .props.onClick();
    const html = await room.render();
    assert.match(html, /Дополнения/);
    if (count >= 7) {
      assert.match(html, /Леди озера/);
      assert.doesNotMatch(html, /Без дополнений/);
    } else {
      assert.match(html, /Без дополнений/);
      assert.doesNotMatch(html, /Леди озера/);
    }
  }
});

test('guest setup explains authentication and lets visitors choose difficulty before signing in', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    locale: 'ru',
    profile: null,
  });
  t.after(room.stop);
  assert.match(room.html, /Настройки можно выбрать заранее/);
  for (const mode of ['regular', 'smart', 'beginner']) {
    assert.equal(room.nodes('input').find((node) => node.props.value === mode).props.disabled, false);
  }
  room
    .nodes('input')
    .find((node) => node.props.value === 'smart')
    .props['onUpdate:modelValue']('smart');
  await room.render();
  await room
    .nodes('v-btn')
    .find((node) => 'data-create-bot-game' in node.props)
    .props.onClick();
  assert.deepEqual(room.sent, []);
  assert.equal(room.notifications[0][0], 'openAuthModal');
});

test('first game hides larger tables and restores them when changing difficulty', async (t) => {
  const room = await fixture('pages/lobby/BotGameSetup.vue', {
    props: { modelValue: true },
    profile: null,
  });
  t.after(room.stop);
  const counts = () =>
    room
      .nodes('button')
      .filter((node) => node.props?.['data-player-count'])
      .map((node) => node.props['data-player-count']);
  room
    .nodes('button')
    .find((node) => node.props['data-player-count'] === 6)
    .props.onClick();
  room
    .nodes('input')
    .find((node) => node.props.value === 'beginner')
    .props['onUpdate:modelValue']('beginner');
  await room.render();
  assert.deepEqual(counts(), [5]);
  assert.equal(room.nodes('button').find((node) => node.props['data-player-count'] === 5).props['aria-pressed'], true);
  room
    .nodes('input')
    .find((node) => node.props.value === 'regular')
    .props['onUpdate:modelValue']('regular');
  await room.render();
  assert.deepEqual(counts(), [5, 6, 7, 8]);
});

test('AI rows show dates only after completion', async (t) => {
  for (const finished of [false, true]) {
    const room = await fixture('pages/lobby/LobbyRoom.vue', {
      locale: 'ru',
      props: {
        game: {
          uuid: 'date',
          hostID: 'host',
          ai: true,
          aiTitle: 'Alice vs 4 Bots',
          aiStatus: finished ? 'finished' : 'running',
          players: 5,
          state: 'started',
          options: { roles: {}, addons: {} },
          createAt: '2026-10-14T18:00:00Z',
          ...(finished ? { result: { winner: 'good' } } : {}),
        },
      },
    });
    t.after(room.stop);
    assert.equal(room.html.includes('ai-date'), finished);
  }
});

for (const language of ['es', 'vi']) {
  test(`AI setup creates and starts a room using ${language}`, async (t) => {
    const setup = await fixture('pages/lobby/BotGameSetup.vue', {
      props: { modelValue: true },
      locale: language,
      accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true }) },
    });
    t.after(setup.stop);
    const select = setup.nodes('v-select').find((node) => 'data-bot-language' in node.props);
    assert.equal(select.props.modelValue, language);
    assert.ok(select.props.items.some((item) => item.value === language));
    await setup
      .nodes('v-btn')
      .find((node) => 'data-create-bot-game' in node.props)
      .props.onClick();
    assert.equal(setup.sent[0][1].language, language);
    const room = await fixture('components/view/board/modules/BotGameChoices.vue', {
      props: { roomID: 'bot-room', language },
      accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ regular: true }) },
    });
    t.after(room.stop);
    await room
      .nodes('v-btn')
      .find((node) => node.props['data-bot-mode'] === 'regular')
      .props.onClick();
    assert.deepEqual(room.sent, [['startHumanAiRoom', 'bot-room', { difficulty: 'regular', language }]]);
  });
}

test('only administrators receive the dashboard destination in a finished room panel', async (t) => {
  const props = { roomID: 'finished-bot-room', ai: { model: 'codex-chatgpt', status: 'finished', playerCount: 7 } };
  const admin = await fixture('components/view/panels/AiRoomPanel.vue', { props });
  t.after(admin.stop);
  const link = admin.nodes('v-btn').find((node) => node.props?.to?.name === 'adminBots');
  assert.ok(link, 'administrators can open the dashboard after a game has ended');
  const member = await fixture('components/view/panels/AiRoomPanel.vue', {
    props,
    accessOverrides: { canManage: vue.ref(false) },
  });
  t.after(member.stop);
  assert.ok(!member.nodes('v-btn').some((node) => node.props?.to?.name === 'adminBots'));
});
