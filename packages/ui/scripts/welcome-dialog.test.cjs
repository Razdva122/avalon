const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { parse } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });

function component(path, imports = {}) {
  const { descriptor } = parse(fs.readFileSync(require.resolve(path), 'utf8'));
  const code = ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === 'vue') return require('vue');
    return imports[id] || {};
  }, exports);
  return exports.default;
}

function auth(reply, routeID = 'profile') {
  const actions = [];
  const options = component('../src/components/user/AuthModal.vue', {
    '@/helpers/acquisition': require('../src/helpers/acquisition.ts'),
    '@/router/paths': require('../src/router/paths.js'),
  });
  const state = {
    overlay: true,
    authRequest: 0,
    error: '',
    $route: { name: routeID, meta: { id: routeID }, fullPath: '/' + routeID + '/' },
    $i18n: { locale: 'en' },
    $store: { dispatch: async () => reply },
    $router: { push: async (path) => actions.push(['navigate', path]) },
    $emit: (event) => actions.push(['emit', event]),
  };
  for (const [name, method] of Object.entries(options.methods)) state[name] = method.bind(state);
  return { state, actions };
}

test('registering from a room link keeps the room and does not open welcome over play', async () => {
  const { state, actions } = auth({ id: 'new-user' }, 'room');
  await state.registerUser();
  assert.equal(state.overlay, false);
  assert.deepEqual(actions, []);
});

test('successful registration opens the welcome dialog after reaching the lobby', async () => {
  const { state, actions } = auth({ id: 'new-user' });
  await state.registerUser();
  assert.equal(state.overlay, false);
  assert.deepEqual(actions, [
    ['navigate', '/'],
    ['emit', 'registered'],
  ]);
});

test('failed registration leaves the form open without showing welcome', async () => {
  const { state, actions } = auth({ error: 'emailAlreadyExist' });
  await state.registerUser();
  assert.equal(state.overlay, true);
  assert.equal(state.error, 'emailAlreadyExist');
  assert.deepEqual(actions, []);
});

test('signing in to an existing account does not show welcome', async () => {
  const { state, actions } = auth({ id: 'existing-user' });
  await state.loginInAccount();
  assert.equal(state.overlay, false);
  assert.deepEqual(actions, []);
});

function welcome(request) {
  const actions = [];
  const helper = {};
  const helperCode = ts.transpileModule(fs.readFileSync(require.resolve('../src/helpers/open-room-route.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', helperCode)(helper);
  const options = component('../src/components/user/WelcomeModal.vue', {
    '@/api/socket': { socket: { timeout: () => ({ emitWithAck: request }) } },
    '@/helpers/open-room-route': helper,
  });
  const state = {
    ...options.data(),
    $router: { beforeResolve: () => () => {}, push: async (route) => actions.push(['navigate', route]) && undefined },
    $emit: (...args) => actions.push(['emit', ...args]),
  };
  Object.defineProperty(state, 'busy', { get: () => options.computed.busy.call(state) });
  for (const [name, method] of Object.entries(options.methods)) state[name] = method.bind(state);
  return { state, actions };
}

test('creating a room ignores repeated clicks and closes welcome after navigation', async () => {
  let resolve;
  let requests = 0;
  const { state, actions } = welcome(() => {
    requests++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  const pending = state.createRoom();
  assert.equal(state.busy, true);
  await state.createRoom();
  assert.equal(requests, 1);
  resolve('new-room');
  await pending;
  assert.equal(state.busy, false);
  assert.deepEqual(actions, [
    ['navigate', { name: 'room', params: { uuid: 'new-room' } }],
    ['emit', 'update:modelValue', false],
  ]);
});

test('a rejected room request keeps welcome open and allows retry', async () => {
  const { state, actions } = welcome(async () => ({ error: 'forbidden' }));
  await state.createRoom();
  assert.equal(state.error, 'forbidden');
  assert.equal(state.busy, false);
  assert.deepEqual(actions, []);
});

test('a timed-out room request keeps welcome open with an error', async () => {
  const { state, actions } = welcome(async () => {
    throw new Error('timeout');
  });
  await state.createRoom();
  assert.equal(state.error, 'requestFailed');
  assert.equal(state.busy, false);
  assert.deepEqual(actions, []);
});

test('closing during human room creation ignores the late room response', async () => {
  let finish;
  const { state, actions } = welcome(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = state.createRoom();
  state.close();
  finish('late-room');
  await pending;
  assert.deepEqual(actions, [['emit', 'update:modelValue', false]]);
});

test('an unmounted welcome cannot navigate or show a late error', async () => {
  let fail;
  const { state, actions } = welcome(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  const pending = state.createRoom();
  const options = component('../src/components/user/WelcomeModal.vue');
  options.beforeUnmount.call(state);
  fail(Error('offline'));
  await pending;
  assert.deepEqual(actions, []);
  assert.equal(state.error, '');
});

test('AI loading disables human creation without activating its spinner', async () => {
  const { state, actions } = welcome(async () => 'unexpected-room');
  state.aiBusy = true;
  assert.equal(state.busy, true);
  assert.equal(state.creating, false);
  await state.createRoom();
  assert.deepEqual(actions, []);
});

test('finishing an AI request preserves its error until the next attempt', () => {
  const { state } = welcome(async () => 'room');
  state.setAiBusy(true);
  state.aiError = 'AI is unavailable';
  state.setAiBusy(false);
  assert.equal(state.aiError, 'AI is unavailable');
  state.setAiBusy(true);
  assert.equal(state.aiError, '');
});

for (const method of ['registerUser', 'loginInAccount']) {
  test(`${method} resumes the requested action without navigation or welcome`, async () => {
    const { state, actions } = auth({ id: 'new-user' }, 'lobby');
    state.continuation = { route: '/lobby/', resume: async () => actions.push(['created-room']) };
    await state[method]();
    assert.equal(state.overlay, false);
    assert.deepEqual(actions, [['created-room']]);
  });
}

test('a request from a previous page cannot resume after navigation', async () => {
  const { state, actions } = auth({ id: 'new-user' }, 'wiki');
  state.continuation = { route: '/lobby/', resume: () => actions.push(['created-room']) };
  await state.registerUser();
  assert.deepEqual(actions, [
    ['navigate', '/'],
    ['emit', 'registered'],
  ]);
});

test('failed registration keeps its action available for a successful retry', async () => {
  const { state, actions } = auth({ error: 'emailAlreadyExist' }, 'lobby');
  state.continuation = { route: '/lobby/', resume: () => actions.push(['created-room']) };
  await state.registerUser();
  assert.deepEqual(actions, []);
  state.$store.dispatch = async () => ({ id: 'new-user' });
  await state.registerUser();
  assert.deepEqual(actions, [['created-room']]);
});

test('joining after authentication seats the user instead of leaving an already joined room', async () => {
  const vue = require('vue');
  const store = { state: vue.reactive({ profile: null }) };
  const requests = [];
  const sent = [];
  const options = component('../src/components/view/panels/StartPanel.vue', {
    'vue-i18n': { useI18n: () => ({ t: (key) => key, locale: vue.ref('en') }) },
    '@/router/paths': require('../src/router/paths.js'),
    '@/store': { useStore: () => store },
    '@/api/socket': { socket: { emit: (...args) => sent.push(args) } },
    '@/helpers/event-bus': { default: { emit: (...args) => requests.push(args) } },
  });
  const roomState = vue.reactive({ roomID: 'invited-room', players: [], stage: 'created' });
  const state = options.setup({ roomState });
  state.onJoinClick();
  assert.deepEqual(sent, []);
  const resume = requests.find(([event]) => event === 'openAuthModal')[1];
  assert.equal(typeof resume, 'function');
  store.state.profile = { id: 'new-user' };
  await resume();
  assert.deepEqual(sent, [['joinGame', 'invited-room']]);
  roomState.players.push({ id: 'new-user' });
  await resume();
  assert.deepEqual(sent, [['joinGame', 'invited-room']]);
});

for (const method of ['registerUser', 'loginInAccount']) {
  test(`${method} ignores a cancelled reply after auth reopens for another action`, async () => {
    const { state, actions } = auth({ id: 'new-user' }, 'lobby');
    let finish;
    state.$store.dispatch = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    state.continuation = { route: '/lobby/', resume: () => actions.push(['old-action']) };
    const pending = state[method]();
    state.closeAuthModal();
    state.overlay = true;
    state.continuation = { route: '/lobby/', resume: () => actions.push(['new-action']) };
    finish({ id: 'new-user' });
    await pending;
    assert.deepEqual(actions, []);
    assert.equal(state.overlay, true);
  });
}
