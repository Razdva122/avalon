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
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/room.ts`), 'utf8')).default,
      ...evaluate(fs.readFileSync(path.join(__dirname, `../src/i18n/langs/${locale}/ui.ts`), 'utf8'), (id) =>
        id === '../../suggestions' ? suggestions : require(id),
      ).default,
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
    accessOverrides = {},
    acknowledge = async () => ({ roomID: 'created-room' }),
  } = {},
) {
  const sent = [];
  const navigation = [];
  const notifications = [];
  const access = {
    canManage: vue.ref(true),
    canPlay: vue.ref(false),
    botModes: vue.ref({ smart: false, regular: false }),
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
    if (id === 'vue') return vue;
    if (id === 'vue-i18n') return { useI18n: () => i18n.global };
    if (id === 'vue-router') return { useRouter: () => ({ push: async (route) => navigation.push(route) }) };
    if (id === '@/store') return { useStore: () => ({ state: { profile: { id: 'owner' } } }) };
    if (id === '@/router/paths') return { localizedPath: (url) => url, neutralRoomUrl: (url) => url };
    if (id === '@/helpers/event-bus') return { default: { emit: (...args) => notifications.push(args) } };
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
    if (id.endsWith('.vue')) return { default: { name: path.basename(id, '.vue'), render: () => null } };
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
  const state = scope.run(() => component.setup(vue.reactive(props), { expose() {}, emit() {} }));
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
  function nodes(type, node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [
      ...(node.type === type || node.type?.name === type ? [node] : []),
      ...(Array.isArray(node.children) ? node.children.flatMap((child) => nodes(type, child)) : []),
    ];
  }
  return { html, nodes, sent, navigation, notifications, access, render: renderHtml, stop: () => scope.stop() };
}

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
    assert.equal(room.nodes('select').length, 1);
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
    ['es', 'en'],
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
  assert.ok(room.nodes('v-btn').every((node) => node.props.disabled));
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

test('lobby bot button is visible only to eligible players with an available mode or their own room', async (t) => {
  for (const [canPlay, smart, regular, ownRoomID, visible] of [
    [false, true, true, undefined, false],
    [true, false, false, undefined, false],
    [true, true, false, undefined, true],
    [true, false, true, undefined, true],
    [true, false, false, 'existing-room', true],
  ]) {
    const room = await fixture('pages/lobby/BotRoomButton.vue', {
      locale: 'ru',
      accessOverrides: {
        canPlay: vue.ref(canPlay),
        botModes: vue.ref({ smart, regular }),
        ownRoomID: vue.ref(ownRoomID),
      },
    });
    t.after(room.stop);
    assert.equal(room.nodes('v-btn').length, visible ? 1 : 0);
    if (visible) assert.ok(room.html.includes(ownRoomID ? 'Продолжить мою партию' : 'Сыграть с AI'));
  }
});

test('lobby players return to their reserved room even while new bot games are unavailable', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    accessOverrides: {
      canPlay: vue.ref(true),
      botModes: vue.ref({ smart: false, regular: false }),
      ownRoomID: vue.ref('own-room'),
    },
  });
  t.after(room.stop);
  assert.equal(room.nodes('v-btn').length, 1);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, []);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'own-room' } }]);
});

test('lobby bot button creates only a waiting room without choosing a model or starting inference', async (t) => {
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: false, regular: true }) },
  });
  t.after(room.stop);
  await room.nodes('v-btn')[0].props.onClick();
  assert.deepEqual(room.sent, [['createHumanAiRoom']]);
  assert.deepEqual(room.navigation, [{ name: 'room', params: { uuid: 'created-room' } }]);
});

test('lobby bot button prevents duplicate creation while awaiting the server', async (t) => {
  let finish;
  const room = await fixture('pages/lobby/BotRoomButton.vue', {
    accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
    acknowledge: () => new Promise((resolve) => (finish = resolve)),
  });
  t.after(room.stop);
  const button = room.nodes('v-btn')[0];
  const opening = button.props.onClick();
  await button.props.onClick();
  await room.render();
  assert.deepEqual(room.sent, [['createHumanAiRoom']]);
  assert.ok(room.nodes('v-btn')[0].props.disabled);
  finish({ roomID: 'created-room' });
  await opening;
});

test('lobby bot creation errors use localized notifications instead of exposing server messages', async (t) => {
  for (const acknowledge of [
    async () => ({ error: 'internal quota trace' }),
    async () => {
      throw Error('offline');
    },
  ]) {
    const room = await fixture('pages/lobby/BotRoomButton.vue', {
      locale: 'ru',
      accessOverrides: { canPlay: vue.ref(true), botModes: vue.ref({ smart: true, regular: true }) },
      acknowledge,
    });
    t.after(room.stop);
    await room.nodes('v-btn')[0].props.onClick();
    assert.deepEqual(room.navigation, []);
    assert.equal(room.notifications.length, 1);
    assert.equal(room.notifications[0][0], 'infoMessage');
    assert.ok(room.notifications[0][1] && !room.notifications[0][1].includes('internal quota trace'));
    assert.ok(!room.notifications[0][1].startsWith('aiArena.'), 'notification must be translated');
    await room.render();
    assert.equal(room.nodes('v-btn')[0].props.disabled, false);
  }
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
    room.nodes('option', language).map((option) => [option.props.value, option.children]),
    [
      ['en', 'English'],
      ['ru', 'Русский'],
      ['zh-tw', '繁體中文（台灣）'],
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
