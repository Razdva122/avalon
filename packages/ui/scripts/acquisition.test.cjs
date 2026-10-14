const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { parse } = require('@vue/compiler-sfc');
const first = 'social-deduction-games-online';
const second = 'games-like-secret-hitler';
const sourceKey = 'avalon:initial-guide';

function fixture({ blockedStorage = false, analytics = true, prerender = false, browser = true, stored } = {}) {
  const events = [];
  const values = new Map(stored ? [[sourceKey, stored]] : []);
  const window = browser
    ? {
        sessionStorage: {
          getItem: (key) => {
            if (blockedStorage) throw Error('storage blocked');
            return values.get(key) || null;
          },
          setItem: (key, value) => {
            if (blockedStorage) throw Error('storage blocked');
            values.set(key, value);
          },
        },
        ...(analytics ? { gtag: (...args) => events.push(args) } : {}),
        ...(prerender ? { __AVALON_PRERENDER__: true } : {}),
      }
    : undefined;
  const helper = {};
  const file = path.join(__dirname, '../src/helpers/acquisition.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', 'window', code)(helper, window);
  return { helper, events, window, values };
}

function auth(helper, routeID, reply = { id: 'private-user', email: 'private@example.com' }) {
  const actions = [];
  const { descriptor } = parse(fs.readFileSync(path.join(__dirname, '../src/components/user/AuthModal.vue'), 'utf8'));
  const code = ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, (id) =>
    id === 'vue'
      ? require('vue')
      : id === '@/helpers/acquisition'
        ? helper
        : id === '@/router/paths'
          ? require('../src/router/paths.js')
          : {},
  );
  const state = {
    overlay: true,
    authRequest: 0,
    error: '',
    mode: 'auth',
    $route: { name: routeID + 'ru', meta: { id: routeID }, fullPath: '/ru/' + routeID + '/' },
    $i18n: { locale: 'ru' },
    $store: { dispatch: async () => reply },
    $router: { push: async (route) => actions.push(['navigate', route]) },
    $emit: (event) => actions.push(['emit', event]),
  };
  for (const [name, method] of Object.entries(exports.default.methods)) state[name] = method.bind(state);
  return { state, actions };
}

function room({ roomID = 'private-room', stage = 'created', gameStage = 'selectTeam', seated = true, ...other } = {}) {
  return {
    roomID,
    stage,
    players: seated ? [{ id: 'private-user' }] : [],
    ...(stage === 'started'
      ? {
          game: {
            uuid: roomID,
            stage: gameStage,
            history: [],
            players: seated ? [{ id: 'private-user', features: {} }] : [],
            ...(gameStage === 'end' ? { result: { winner: 'good', reason: 'goodTeamMissions' } } : {}),
          },
        }
      : {}),
    ...other,
  };
}

const payload = (guide = first, extras = {}) => ({
  guide_slug: guide,
  page_location: 'https://avalon-game.com/',
  page_referrer: '',
  ...extras,
});

test('guide visits retain the initial allowlisted source, and CTA events contain only safe categorical fields', () => {
  const { helper, events, values } = fixture();
  helper.trackGuideVisit(first);
  helper.trackGuideVisit(second);
  helper.trackGuideCta(second, 'lobby');
  assert.equal(values.get(sourceKey), first);
  assert.deepEqual(events, [
    ['event', 'guide_visit', payload(first, { page_location: `https://avalon-game.com/guides/${first}/` })],
    ['event', 'guide_visit', payload(first, { page_location: `https://avalon-game.com/guides/${second}/` })],
    [
      'event',
      'guide_cta',
      payload(first, { destination: 'lobby', page_location: `https://avalon-game.com/guides/${second}/` }),
    ],
  ]);
});

test('guide-origin signup stays in the selected play destination, then consumes intent', async () => {
  const { helper, events } = fixture();
  helper.trackGuideVisit(first);
  for (const destination of ['lobby', 'community']) {
    helper.trackGuideCta(first, destination);
    const { state, actions } = auth(helper, destination === 'community' ? 'community_solo' : 'lobby');
    await state.registerUser();
    assert.equal(state.overlay, false);
    assert.deepEqual(actions, []);
    const next = auth(helper, 'lobby');
    await next.state.registerUser();
    assert.deepEqual(next.actions, [
      ['navigate', '/ru/'],
      ['emit', 'registered'],
    ]);
  }
  assert.equal(events.filter((event) => event[1] === 'sign_up').length, 4);
  for (const event of events.filter((event) => event[1] === 'sign_up')) assert.deepEqual(event[2], payload());
});

test('an AI guide CTA retains lobby signup and emits the safe AI category, then consumes intent', async () => {
  const { helper, events } = fixture();
  helper.trackGuideCta(first, 'ai');
  const signup = auth(helper, 'lobby');
  signup.state.$route.hash = '#play-with-ai';
  await signup.state.registerUser();
  assert.equal(signup.state.overlay, false);
  assert.deepEqual(signup.actions, []);
  assert.deepEqual(
    events.filter((event) => ['guide_cta', 'sign_up'].includes(event[1])),
    [
      [
        'event',
        'guide_cta',
        payload(first, { destination: 'ai', page_location: `https://avalon-game.com/guides/${first}/` }),
      ],
      ['event', 'sign_up', payload()],
    ],
  );
  const later = auth(helper, 'lobby');
  await later.state.registerUser();
  assert.deepEqual(later.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
});

test('an AI guide CTA cannot override registration in community and its mismatch consumes the pending intent', async () => {
  const { helper, events } = fixture();
  helper.trackGuideCta(first, 'ai');
  assert.deepEqual(events, [
    [
      'event',
      'guide_cta',
      payload(first, { destination: 'ai', page_location: `https://avalon-game.com/guides/${first}/` }),
    ],
  ]);
  const mismatch = auth(helper, 'community_solo');
  await mismatch.state.registerUser();
  assert.deepEqual(mismatch.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
  const later = auth(helper, 'lobby');
  await later.state.registerUser();
  assert.deepEqual(later.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
});

test('visits alone and mismatched destinations retain normal lobby/welcome registration', async () => {
  const { helper } = fixture();
  helper.trackGuideVisit(first);
  const visitOnly = auth(helper, 'lobby');
  await visitOnly.state.registerUser();
  assert.deepEqual(visitOnly.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
  helper.trackGuideCta(first, 'community');
  const mismatch = auth(helper, 'lobby');
  await mismatch.state.registerUser();
  assert.deepEqual(mismatch.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
  const later = auth(helper, 'community_solo');
  await later.state.registerUser();
  assert.deepEqual(later.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
});

test('failed signup keeps play intent for retry, while successful login consumes it without a signup event', async () => {
  const { helper, events } = fixture();
  helper.trackGuideCta(first, 'lobby');
  const failed = auth(helper, 'lobby', { error: 'emailAlreadyExist' });
  await failed.state.registerUser();
  assert.equal(failed.state.overlay, true);
  assert.equal(
    events.some((event) => event[1] === 'sign_up'),
    false,
  );
  const retry = auth(helper, 'lobby');
  await retry.state.registerUser();
  assert.deepEqual(retry.actions, []);
  helper.trackGuideCta(first, 'lobby');
  await auth(helper, 'lobby').state.loginInAccount();
  const later = auth(helper, 'lobby');
  await later.state.registerUser();
  assert.deepEqual(later.actions, [
    ['navigate', '/ru/'],
    ['emit', 'registered'],
  ]);
  assert.equal(events.filter((event) => event[1] === 'sign_up').length, 2);
});

test('room participation and live completed human matches are deduplicated without sending identifiers', () => {
  const { helper, events } = fixture();
  helper.trackGuideVisit(first);
  events.length = 0;
  helper.trackRoomAcquisition(room(), 'private-user');
  helper.trackRoomAcquisition(room(), 'private-user', true);
  helper.trackRoomAcquisition(room({ stage: 'started' }), 'private-user');
  helper.trackRoomAcquisition(room({ stage: 'started', gameStage: 'end' }), 'private-user', true);
  helper.trackRoomAcquisition(room({ stage: 'started', gameStage: 'end' }), 'private-user', true);
  assert.deepEqual(events, [
    ['event', 'room_participation', payload()],
    ['event', 'human_game_complete', payload()],
  ]);
});

test('spectators, AI, archives, finished snapshots and manual cancellation never produce a completed human game', () => {
  const { helper, events } = fixture();
  for (const [roomID, extra] of [
    ['spectator', { seated: false }],
    ['AI', { ai: { status: 'running' } }],
    ['archive', { archived: true }],
  ]) {
    helper.trackRoomAcquisition(room({ roomID, stage: 'started', ...extra }), 'private-user');
    helper.trackRoomAcquisition(room({ roomID, stage: 'started', gameStage: 'end', ...extra }), 'private-user', true);
  }
  assert.deepEqual(events, []);
  helper.trackRoomAcquisition(room({ roomID: 'past', stage: 'started', gameStage: 'end' }), 'private-user');
  helper.trackRoomAcquisition(room({ roomID: 'past', stage: 'started', gameStage: 'end' }), 'private-user', true);
  helper.trackRoomAcquisition(room({ roomID: 'snapshot', stage: 'started' }), 'private-user');
  helper.trackRoomAcquisition(room({ roomID: 'snapshot', stage: 'started', gameStage: 'end' }), 'private-user');
  helper.trackRoomAcquisition(room({ roomID: 'cancelled', stage: 'started' }), 'private-user');
  const cancelled = room({ roomID: 'cancelled', stage: 'started', gameStage: 'end' });
  cancelled.game.result = { reason: 'manualy' };
  helper.trackRoomAcquisition(cancelled, 'private-user', true);
  assert.equal(
    events.some((event) => event[1] === 'human_game_complete'),
    false,
  );
});

test('untrusted slugs and destinations cannot become source data or play intent', () => {
  const { helper, events, values } = fixture({ stored: 'private@example.com' });
  helper.trackGuideVisit('private@example.com');
  helper.trackGuideCta('/room/private/?email=private@example.com', 'lobby');
  helper.trackGuideCta(first, '/room/private/');
  assert.deepEqual(events, []);
  assert.equal(helper.consumePlayIntent('lobby'), false);
  helper.trackSignup();
  assert.deepEqual(events, [['event', 'sign_up', { page_location: 'https://avalon-game.com/', page_referrer: '' }]]);
  assert.equal(
    values.get(sourceKey),
    'private@example.com',
    'invalid persisted input is never rewritten into event data',
  );
});

test('blocked storage and analytics are harmless, with in-memory source and play intent retained', async () => {
  const { helper, events, window } = fixture({ blockedStorage: true });
  helper.trackGuideVisit(first);
  helper.trackGuideVisit(second);
  assert.equal(events[1]?.[2].guide_slug, first);
  window.gtag = () => {
    throw Error('analytics blocked');
  };
  helper.trackGuideCta(second, 'lobby');
  const signup = auth(helper, 'lobby');
  await signup.state.registerUser();
  assert.equal(signup.state.overlay, false);
  assert.deepEqual(signup.actions, []);
});

test('missing analytics, no browser and prerender neither throw nor collect data', () => {
  for (const options of [{ analytics: false }, { browser: false }, { prerender: true }]) {
    const { helper, events, values } = fixture(options);
    assert.doesNotThrow(() => {
      helper.trackGuideVisit(first);
      helper.trackGuideCta(first, 'lobby');
      helper.trackSignup();
      helper.trackRoomAcquisition(room(), 'private-user');
    });
    assert.deepEqual(events, []);
    if (options.browser === false || options.prerender) assert.equal(values.size, 0);
  }
});

function script(file, imports) {
  let source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  if (file.endsWith('.vue')) source = parse(source).descriptor.script.content;
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, (id) => imports[id] || (id.startsWith('@/') ? {} : require(id)));
  return exports;
}

async function activeRoom(helper) {
  const vue = require('vue');
  const cleanup = [];
  const runtime = { ...vue, provide() {}, onUnmounted: (callback) => cleanup.push(callback) };
  const handlers = {};
  const socket = {
    on: (name, callback) => {
      handlers[name] = callback;
    },
    off: (name) => {
      delete handlers[name];
    },
    emitWithAck: async () => room(),
    timeout: () => ({ emitWithAck: async () => 1 }),
  };
  const imports = {
    vue: runtime,
    '@/api/socket': { socket },
    '@/store': { useStore: () => ({ state: { profile: { id: 'private-user' } } }) },
    'vue-router': { useRouter: () => ({ push() {} }) },
    '@/helpers/acquisition': helper,
    '@/helpers/room-session': script('../src/helpers/room-session.ts', {}),
    '@/helpers/game-state-manager': script('../src/helpers/game-state-manager/index.ts', { vue: runtime }),
    '@/helpers/composables/useRoomStickers': { useRoomStickers() {} },
    '@/helpers/beginner-tips-session': { beginnerTipsSession: {}, startBeginnerTips() {} },
    '@vueuse/core': { useWindowSize: () => ({ width: vue.ref(1200), height: vue.ref(800) }) },
    '@/helpers/event-bus': { emit() {} },
  };
  const scope = vue.effectScope();
  const state = await scope.run(() =>
    script('../src/pages/room/Room.vue', imports).default.setup({ uuid: 'private-room' }),
  );
  return {
    state,
    handlers,
    cleanup: () => {
      scope.stop();
      cleanup.forEach((callback) => callback());
    },
  };
}

test('the actual room subscribes participation and completion to backend updates even while UI history is open', async () => {
  const { helper, events } = fixture();
  helper.trackGuideVisit(first);
  events.length = 0;
  const active = await activeRoom(helper);
  try {
    assert.deepEqual(events, [['event', 'room_participation', payload()]]);
    active.handlers.roomUpdated(room({ stage: 'started' }));
    active.state.stateManager.viewMode.value = 'history';
    active.handlers.gameUpdated(room({ stage: 'started', gameStage: 'end' }).game);
    active.handlers.gameUpdated(room({ stage: 'started', gameStage: 'end' }).game);
    assert.deepEqual(events, [
      ['event', 'room_participation', payload()],
      ['event', 'human_game_complete', payload()],
    ]);
  } finally {
    active.cleanup();
  }
});

test('localized guide events use only allowlisted canonical locale paths', () => {
  const { helper, events } = fixture();
  helper.trackGuideVisit(first, 'ru');
  helper.trackGuideCta(first, 'ai', 'zh-TW');
  helper.trackGuideVisit(first, 'ru/?email=private@example.com');
  assert.deepEqual(
    events.map((event) => event[2].page_location),
    [
      'https://avalon-game.com/ru/guides/social-deduction-games-online/',
      'https://avalon-game.com/zh-tw/guides/social-deduction-games-online/',
      'https://avalon-game.com/guides/social-deduction-games-online/',
    ],
  );
  assert.equal(events[1][2].destination, 'ai');
});

test('onboarding events accept only categorical fields and never leak input or URLs', () => {
  const { helper, events } = fixture();
  helper.trackOnboarding('auth_open', {
    page: 'lobby',
    action: 'create_room',
    mode: 'registration',
    email: 'private@example.com',
  });
  assert.deepEqual(events[0], [
    'event',
    'auth_open',
    {
      page: 'lobby',
      action: 'create_room',
      mode: 'registration',
      page_location: 'https://avalon-game.com/',
      page_referrer: '',
    },
  ]);
  helper.trackOnboarding('sign_up_error', {
    page: '/room/private/?email=secret',
    error: 'secret backend response',
    action: 'private@example.com',
  });
  assert.deepEqual(events[1][2], {
    page: 'other',
    error: 'other',
    action: 'other',
    page_location: 'https://avalon-game.com/',
    page_referrer: '',
  });
  helper.trackOnboarding('private@example.com', { action: 'create_room' });
  assert.equal(events.length, 2);
});

test('onboarding telemetry is harmless without analytics, during prerender and when analytics throws', () => {
  for (const options of [{ analytics: false }, { prerender: true }, { browser: false }]) {
    const { helper, events } = fixture(options);
    assert.doesNotThrow(() => helper.trackOnboarding('welcome_view', { reason: 'signup' }));
    assert.deepEqual(events, []);
  }
  const { helper, window } = fixture();
  window.gtag = () => {
    throw Error('blocked');
  };
  assert.doesNotThrow(() => helper.trackOnboarding('welcome_choice', { choice: 'ai' }));
});

test('AI participation and completed live games are measured separately from human games', () => {
  const { helper, events } = fixture();
  const ai = { publicBotGame: true, status: 'running' };
  helper.trackRoomAcquisition(room({ stage: 'started', ai }), 'private-user', true);
  helper.trackRoomAcquisition(room({ stage: 'started', gameStage: 'end', ai }), 'private-user', true);
  helper.trackRoomAcquisition(room({ stage: 'started', gameStage: 'end', ai }), 'private-user', true);
  assert.deepEqual(
    events.map((event) => event[1]),
    ['ai_room_participation', 'ai_game_complete'],
  );
});

test('registration records attempt, categorical failure, retry success and continuation', async () => {
  const { helper, events } = fixture();
  const { state } = auth(helper, 'lobby', { error: 'emailAlreadyExist' });
  state.mode = 'registration';
  state.continuation = { route: '/ru/lobby/', action: 'create_room', resume: () => {} };
  await state.registerUser();
  state.$store.dispatch = async () => ({ id: 'new-user' });
  await state.registerUser();
  assert.deepEqual(
    events.map((event) => event[1]),
    ['sign_up_attempt', 'sign_up_error', 'sign_up_attempt', 'sign_up', 'auth_result', 'auth_continue'],
  );
  assert.equal(events[1][2].error, 'emailAlreadyExist');
  assert.equal(events.at(-1)[2].action, 'create_room');
  assert.equal(events.at(-1)[2].result, 'continued');
});

test('welcome records one choice and one dismissal, and ignores repeated close', () => {
  const { helper, events } = fixture();
  const options = script('../src/components/user/WelcomeModal.vue', { '@/helpers/acquisition': helper }).default;
  const state = { dismissed: false, busy: false, aiAvailability: 'available', $emit() {} };
  for (const [name, method] of Object.entries(options.methods)) state[name] = method.bind(state);
  options.watch.modelValue.handler.call(state, true);
  state.chooseCommunity();
  state.close('later');
  assert.deepEqual(
    events.map((event) => event[1]),
    ['welcome_view', 'welcome_choice', 'welcome_dismiss'],
  );
  assert.equal(events[1][2].choice, 'community');
  assert.equal(events[2][2].reason, 'navigation');
});
