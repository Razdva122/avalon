const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Vue = require('vue');
const { renderToString } = require('@vue/server-renderer');

function load(relative, dependencies = {}) {
  let source = fs.readFileSync(require.resolve(relative), 'utf8');
  if (relative.endsWith('.vue')) source = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) =>
      id === 'vue'
        ? Vue
        : id === '@/helpers/socket-errors'
          ? load('../src/helpers/socket-errors.ts')
          : dependencies[id] || {},
    module,
    module.exports,
  );
  return module.exports;
}
const { validators } = load('../src/helpers/validators/index.ts', {
  '@/plugins/i18n': { i18n: { global: { t: (key) => key } } },
});

test('account validators enforce server name, login and email boundaries', () => {
  assert.equal(validators.login('a'.repeat(100)), true);
  assert.notEqual(validators.login('a'.repeat(101)), true);
  assert.equal(validators.email('a'.repeat(248) + '@b.com'), true);
  assert.notEqual(validators.email('a'.repeat(249) + '@b.com'), true);
  assert.notEqual(validators.email('a@b@c.com'), true);
  assert.equal(validators.name('a'.repeat(100)), true);
  for (const name of ['a'.repeat(101), '  ', 'bad\u0000name', 'bad\nname'])
    assert.notEqual(validators.name(name), true);
});

test('new passwords are limited by UTF-8 bytes, including multibyte characters', () => {
  for (const value of ['a'.repeat(72), 'я'.repeat(36), '😀'.repeat(18)])
    assert.equal(validators.maxPasswordBytes(value), true);
  for (const value of ['a'.repeat(73), 'я'.repeat(37), '😀'.repeat(19)])
    assert.notEqual(validators.maxPasswordBytes(value), true);
  assert.notEqual(validators.min8('1234567'), true);
  assert.equal(validators.min8('12345678'), true);
});

test('profile refuses invalid names before optimistic profile update', () => {
  const page = load('../src/pages/profile/Profile.vue', { '@/helpers/validators': { validators } }).default;
  for (const username of ['a'.repeat(101), '\u0000bad', '   ']) {
    const state = {
      username,
      validators,
      $store: {
        state: { profile: { name: 'Old name' } },
        dispatch() {
          assert.fail('invalid name dispatched');
        },
      },
    };
    state.updateAvailable = page.computed.updateAvailable.call(state);
    assert.equal(state.updateAvailable, false);
    page.methods.update.call(state);
  }
});

async function lobby(createResult, roomsResult = []) {
  const routes = [],
    notifications = [];
  const socket = {
    timeout() {
      return this;
    },
    async emitWithAck(event) {
      if (event === 'createRoom') {
        if (createResult instanceof Error) throw createResult;
        return createResult;
      }
      return event === 'getOnlineCounter' ? 1 : typeof roomsResult === 'function' ? roomsResult() : roomsResult;
    },
    on() {},
    off() {},
  };
  const page = load('../src/pages/lobby/Lobby.vue', {
    '@/api/socket': { socket },
    '@/store': { useStore: () => ({ state: { profile: { id: 'user' } } }) },
    'vue-router': { useRouter: () => ({ push: (route) => routes.push(route) }) },
    'vue-i18n': { useI18n: () => ({ t: (key) => key }) },
    '@/helpers/event-bus': { default: { emit: (event, value) => notifications.push([event, value]) } },
    '@/helpers/composables/useAiAccess': { useAiAccess: () => ({ costs: Vue.ref({}) }) },
  }).default;
  let state;
  await renderToString(
    Vue.createSSRApp({
      setup() {
        state = page.setup();
        return () => null;
      },
    }),
  );
  return { state, routes, notifications };
}

test('rejected room creation shows an error and never navigates to the error object', async () => {
  for (const error of ['roomLimit', 'rateLimited', 'invalidRequest', 'requestFailed', 'forbidden']) {
    const { state, routes, notifications } = await lobby({ error });
    await state.createRoom();
    assert.deepEqual(routes, []);
    assert.ok(notifications.some(([, message]) => message === `errors.${error}`));
  }
});

test('room creation timeouts are handled and successful creation still navigates', async () => {
  const failed = await lobby(new Error('timeout'));
  await failed.state.createRoom();
  assert.deepEqual(failed.routes, []);
  assert.ok(failed.notifications.some(([, message]) => message === 'errors.requestFailed'));
  const success = await lobby('room-123');
  await success.state.createRoom();
  assert.deepEqual(success.routes, [{ name: 'room', params: { uuid: 'room-123' } }]);
});

test('statistics reject socket errors instead of exposing an invalid stats object', async () => {
  const page = load('../src/pages/stats/Stats.vue', {
    '@/api/socket': {
      socket: {
        timeout() {
          return this;
        },
        emitWithAck: async () => ({ error: 'rateLimited' }),
      },
    },
    'vue-i18n': { useI18n: () => ({ t: (key) => key }) },
  }).default;
  const state = page.setup();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.state.value, undefined);
  assert.equal(state.error.value, 'rateLimited');
});

function accountStore(reply, onTimeout = () => {}) {
  return load('../src/store/index.ts', {
    vuex: { createStore: (options) => options },
    uuid: require('uuid'),
    '@/api/socket': {
      socket: {
        on() {},
        emit() {},
        timeout(ms) {
          onTimeout(ms);
          return this;
        },
        emitWithAck: async () => (typeof reply === 'function' ? reply() : reply),
      },
    },
    '@/helpers/validators': { validators },
    '@/helpers/event-bus': { default: { emit() {} } },
    '@/plugins/i18n': { i18n: { global: { t: (key) => key } } },
  }).store;
}

test('profile name changes commit only after the server accepts them', async () => {
  for (const response of [{ error: 'rateLimited' }, { error: 'invalidRequest' }, true]) {
    const store = accountStore(response);
    const commits = [];
    const result = await store.actions.updateUserName(
      { state: { profile: { name: 'Old' } }, commit: (...args) => commits.push(args) },
      { name: 'New' },
    );
    assert.deepEqual(result, response);
    assert.equal(commits.length, response === true ? 1 : 0);
    if (response === true) assert.equal(commits[0][1].name, 'New');
  }
});

test('profile read errors cannot be committed as valid private or public profiles', async () => {
  const store = accountStore({ error: 'rateLimited' });
  const commits = [];
  const context = { state: { profile: { name: 'Old' }, users: {} }, commit: (...args) => commits.push(args) };
  await store.actions.refreshProfile(context);
  await store.actions.getUserPublicProfile(context, { uuid: 'user' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    commits.some(([action]) => action === 'updateUserProfile'),
    false,
  );
  assert.equal(
    commits.some(([, value]) => value.user?.status === 'ready'),
    false,
  );
});

async function formRules(componentFile, state) {
  const fields = [];
  const Field = Vue.defineComponent({
    inheritAttrs: false,
    props: ['modelValue', 'rules', 'label'],
    setup(props) {
      fields.push({ label: props.label, valid: props.rules.every((rule) => rule(props.modelValue) === true) });
      return () => null;
    },
  });
  const Container = Vue.defineComponent({
    inheritAttrs: false,
    setup(_props, { slots }) {
      return () => Vue.h('div', slots.default?.());
    },
  });
  const component = load(componentFile, {
    '@/helpers/validators': { validators },
    '@/components/modals/TextField.vue': { default: Field },
    '@/components/modals/PasswordField.vue': { default: Field },
    '@/components/user/BaseModal.vue': { default: Container },
  }).default;
  const template = require('@vue/compiler-sfc').parse(fs.readFileSync(require.resolve(componentFile), 'utf8'))
    .descriptor.template.content;
  const app = Vue.createSSRApp(
    {
      ...component,
      data() {
        const data = { ...component.data.call(this), ...state };
        if (component.props?.mode) delete data.mode;
        return data;
      },
      render: Vue.compile(template),
    },
    { mode: state.mode },
  );
  app.config.globalProperties.$store = { state: {} };
  app.config.globalProperties.$t = (key) => key;
  for (const tag of ['v-form', 'v-btn', 'v-tabs', 'v-tab']) app.component(tag, Container);
  await renderToString(app);
  return fields;
}

test('registration applies limits while sign-in accepts existing short or long passwords', async () => {
  const registration = await formRules('../src/components/user/AuthModal.vue', {
    mode: 'registration',
    login: 'a'.repeat(101),
    email: 'a'.repeat(249) + '@b.com',
    username: 'a'.repeat(101),
    password: 'я'.repeat(37),
  });
  assert.equal(registration.length, 4);
  assert.ok(registration.every((field) => !field.valid));
  for (const password of ['old', 'x'.repeat(80)]) {
    const login = await formRules('../src/components/user/AuthModal.vue', { mode: 'auth', login: 'old', password });
    assert.ok(login.every((field) => field.valid));
  }
});

test('credential changes restrict only the new password, preserving old password compatibility', async () => {
  const fields = await formRules('../src/components/user/CredentialsModal.vue', {
    mode: 'password',
    password: 'old',
    newPassword: '😀'.repeat(19),
  });
  assert.deepEqual(
    fields.map(({ valid }) => valid),
    [true, false],
  );
});

test('room-list errors keep the previous list and provide a retryable error', async () => {
  const rooms = [{ uuid: 'room-123', players: 2, state: 'created', options: {} }];
  const replies = [rooms, { error: 'rateLimited' }];
  const { state } = await lobby('room-123', () => replies.shift());
  assert.deepEqual(state.roomsList.value, rooms);
  await state.initState();
  assert.deepEqual(state.roomsList.value, rooms);
  assert.equal(state.roomsError.value, 'rateLimited');
  assert.equal(state.visibleRooms.value[0].uuid, 'room-123');
});

test('statistics retain the last successful result when a refresh is rejected', async () => {
  const stats = { roleStats: [], byPlayers: [], addonsStats: [], total: { gamesCount: 0 } };
  const replies = [stats, { error: 'requestFailed' }];
  const page = load('../src/pages/stats/Stats.vue', {
    '@/api/socket': {
      socket: {
        timeout() {
          return this;
        },
        emitWithAck: async () => replies.shift(),
      },
    },
    'vue-i18n': { useI18n: () => ({ t: (key) => key }) },
  }).default;
  const state = page.setup();
  await new Promise((resolve) => setImmediate(resolve));
  await state.initState();
  assert.deepEqual(state.state.value, stats);
  assert.equal(state.error.value, 'requestFailed');
  assert.deepEqual(state.rolesTables.value.good, []);
});

for (const failure of [{ error: 'rateLimited' }, new Error('timeout')]) {
  test(`failed public profile lookup can retry without reactive retry loops: ${failure.error || failure.message}`, async () => {
    let requests = 0;
    let completeRetry;
    const store = accountStore(() => {
      requests++;
      if (requests === 1) {
        if (failure instanceof Error) throw failure;
        return failure;
      }
      return new Promise((resolve) => {
        completeRetry = resolve;
      });
    });
    const state = Vue.reactive({ users: {} });
    const context = { state, commit: (mutation, payload) => store.mutations[mutation](state, payload) };
    const stop = Vue.watchEffect(() => {
      void store.actions.getUserPublicProfile(context, { uuid: 'user' });
    });
    try {
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(requests, 1, 'a failed lookup must not automatically retry in a reactive loop');
      await store.actions.getUserPublicProfile(context, { uuid: 'user' });
      assert.equal(requests, 2, 'a later lookup must retry the failed request');
      await store.actions.getUserPublicProfile(context, { uuid: 'user' });
      assert.equal(requests, 2, 'concurrent retry calls must share the in-flight request');
      completeRetry({ id: 'user', name: 'Alice', avatar: 'avatar' });
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(state.users.user.status, 'ready');
      assert.equal(state.users.user.profile.name, 'Alice');
      await store.actions.getUserPublicProfile(context, { uuid: 'user' });
      assert.equal(requests, 2, 'successful profile responses remain cached');
    } finally {
      stop();
    }
  });
}

test('registration has a bounded wait and commits only accepted accounts', async () => {
  for (const reply of [{ error: 'rateLimited' }, { id: 'new-user' }]) {
    const timeouts = [],
      commits = [];
    const store = accountStore(reply, (ms) => timeouts.push(ms));
    const result = await store.actions.registerUser(
      { commit: (...args) => commits.push(args) },
      {
        login: 'testuser',
        email: 'test@example.com',
        name: 'Test',
        password: 'password123',
      },
    );
    assert.deepEqual(timeouts, [10000]);
    assert.deepEqual(result, reply);
    assert.equal(commits.length, 'error' in reply ? 0 : 1);
  }
});

test('registration transport errors return an error to both normal and developer forms', async () => {
  const store = accountStore(() => {
    throw new Error('timeout');
  });
  const commits = [];
  const result = await store.actions.registerUser(
    { commit: (...args) => commits.push(args) },
    {
      login: 'testuser',
      email: 'test@example.com',
      name: 'Test',
      password: 'password123',
    },
  );
  assert.deepEqual(result, { error: 'requestFailed' });
  assert.deepEqual(commits, []);
});
