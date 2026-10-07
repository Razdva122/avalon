const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const types = require('../../types/player-board.ts');
function pageHarness(query = {}, profile = { id: 'alice', token: 'alice-token' }, prerender = false, kind = 'solo') {
  const pending = [],
    mounted = [],
    unmounted = [];
  const store = { state: vue.reactive({ profile }) };
  const route = vue.reactive({ query, path: '/ru/community/players/' });
  const navigations = [];
  const router = {
    push: async (to) => {
      navigations.push(to);
      route.query = to.query;
    },
  };
  const file = path.resolve(__dirname, '../src/pages/community/PlayerBoards.vue');
  const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
  const script = compileScript(descriptor, { id: file });
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const customRequire = (id) => {
    if (id === 'vue')
      return { ...vue, onMounted: (cb) => mounted.push(cb), onBeforeUnmount: (cb) => unmounted.push(cb) };
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
    if (id === 'vue-router') return { useRoute: () => route, useRouter: () => router };
    if (id === './board-form-session') return require('../src/pages/community/board-form-session.ts');
    if (id === '@/store') return { useStore: () => store };
    if (id === '@/api/player-boards')
      return {
        boardRequest: (url, method, body) =>
          new Promise((resolve, reject) => pending.push({ url, method, body, resolve, reject })),
      };
    if (id === '@avalon/types/player-board') return types;
    if (id === './board-helpers') return require('../src/pages/community/board-helpers.ts');
    if (id === '@/helpers/prerender') return { prerender };
    if (id === '@/helpers/event-bus') return { default: { emit() {} } };
    return {};
  };
  new Function('require', 'module', 'exports', code)(customRequire, module, module.exports);
  const scope = vue.effectScope();
  const page = scope.run(() => module.exports.default.setup({ kind }, { expose() {} }));
  mounted.forEach((cb) => cb());
  return {
    page,
    store,
    route,
    navigations,
    pending,
    stop() {
      unmounted.forEach((cb) => cb());
      scope.stop();
    },
  };
}
const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};
const account = (name) => ({ listings: [{ id: name, kind: 'solo' }], canRecruit: true, banned: false, isAdmin: false });
test('switching accounts cannot restore a previous user listing from a late response', async () => {
  const h = pageHarness();
  try {
    const alice = h.pending.find((p) => p.url === '/me');
    h.store.state.profile = { id: 'bob', token: 'bob-token' };
    await vue.nextTick();
    const bob = h.pending.filter((p) => p.url === '/me').at(-1);
    bob.resolve(account('bob'));
    await flush();
    alice.resolve(account('alice'));
    await flush();
    assert.equal(h.page.own.value.id, 'bob');
    h.store.state.profile = null;
    await vue.nextTick();
    assert.equal(h.page.account.value, null);
    assert.equal(h.page.own.value, undefined);
  } finally {
    h.stop();
  }
});
test('a newer language filter wins over a slow earlier public response', async () => {
  const h = pageHarness();
  try {
    const first = h.pending.find((p) => p.url.startsWith('?'));
    h.page.language.value = 'cmn';
    await vue.nextTick();
    const filtered = h.pending.filter((p) => p.url.startsWith('?')).at(-1);
    assert.match(filtered.url, /language=cmn/);
    filtered.resolve({ listings: [{ id: 'new' }], hasMore: false });
    await flush();
    first.resolve({ listings: [{ id: 'old' }], hasMore: true });
    await flush();
    assert.equal(h.page.listings.value[0].id, 'new');
    assert.equal(h.page.hasMore.value, false);
  } finally {
    h.stop();
  }
});
test('failed save preserves the form and draft, without claiming success', async () => {
  const h = pageHarness();
  try {
    h.page.editing.value = true;
    const draft = { kind: 'solo', contacts: [{ type: 'line', value: 'player' }] };
    const saving = h.page.save(draft);
    const request = h.pending.at(-1);
    assert.equal(request.url, '/me/solo');
    assert.equal(request.method, 'PUT');
    assert.deepEqual(request.body, draft);
    request.reject(Error('invalidError'));
    await saving;
    assert.equal(h.page.editing.value, true);
    assert.equal(h.page.error.value, 'invalidError');
    assert.equal(h.page.success.value, '');
    assert.equal(h.page.busy.value, false);
  } finally {
    h.stop();
  }
});
test('changing the public language filter preserves an in-progress draft', async () => {
  const h = pageHarness();
  try {
    h.page.editing.value = true;
    h.page.language.value = 'other';
    await vue.nextTick();
    assert.equal(h.page.editing.value, true);
  } finally {
    h.stop();
  }
});

test('filters restore from shared URLs and browser back restores the API query', async () => {
  const h = pageHarness({ language: 'ru', communication: 'voice', page: '2' });
  try {
    assert.equal(h.pending[0].url, '?kind=solo&page=2&language=ru&communication=voice');
    h.page.communication.value = 'text';
    await vue.nextTick();
    assert.deepEqual(h.route.query, { language: 'ru', communication: 'text' });
    assert.equal(
      h.pending.filter((p) => p.url.startsWith('?')).at(-1).url,
      '?kind=solo&page=1&language=ru&communication=text',
    );
    h.route.query = { language: 'ru', communication: 'voice', page: '2' };
    await vue.nextTick();
    assert.equal(
      h.pending.filter((p) => p.url.startsWith('?')).at(-1).url,
      '?kind=solo&page=2&language=ru&communication=voice',
    );
  } finally {
    h.stop();
  }
});
test('publishing intent survives sign-in and opens after account eligibility arrives', async () => {
  const h = pageHarness({}, null);
  try {
    h.page.startPublish();
    assert.equal(h.page.editing.value, false);
    h.store.state.profile = { id: 'alice', token: 'alice-token' };
    await vue.nextTick();
    h.pending.find((p) => p.url === '/me').resolve({ listings: [], banned: false, canRecruit: true });
    await flush();
    assert.equal(h.page.editing.value, true);
  } finally {
    h.stop();
  }
});
test('an unrelated sign-in does not automatically open the publication form', async () => {
  const h = pageHarness({}, null);
  try {
    h.store.state.profile = { id: 'alice', token: 'alice-token' };
    await vue.nextTick();
    h.pending.find((p) => p.url === '/me').resolve({ listings: [], banned: false, canRecruit: true });
    await flush();
    assert.equal(h.page.editing.value, false);
  } finally {
    h.stop();
  }
});

test('prerender shows the same loading state as the client before public data arrives', () => {
  const h = pageHarness({}, null, true);
  try {
    assert.equal(h.page.loading.value, true);
    assert.equal(h.pending.length, 0);
  } finally {
    h.stop();
  }
});

test('successful publication clears only its draft after the server accepts it', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const items = new Map([
    ['avalon:board-draft:alice:solo:new', 'draft'],
    ['avalon:board-draft:bob:solo:new', 'other'],
  ]);
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { removeItem: (key) => items.delete(key) },
  });
  const h = pageHarness();
  try {
    h.page.editing.value = true;
    const saving = h.page.save({ kind: 'solo' });
    assert.ok(items.has('avalon:board-draft:alice:solo:new'));
    h.pending.find((p) => p.method === 'PUT').resolve({});
    await flush();
    h.pending
      .filter((p) => p.url.startsWith('?'))
      .at(-1)
      .resolve({ listings: [], hasMore: false });
    h.pending
      .filter((p) => p.url === '/me')
      .at(-1)
      .resolve(account('alice'));
    await saving;
    assert.equal(items.has('avalon:board-draft:alice:solo:new'), false);
    assert.equal(items.get('avalon:board-draft:bob:solo:new'), 'other');
    assert.equal(h.page.editing.value, false);
  } finally {
    h.stop();
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else delete globalThis.sessionStorage;
  }
});

for (const permissions of [
  { banned: true, canRecruit: true },
  { banned: false, canRecruit: false },
]) {
  test(`sign-in intent cannot bypass team publishing permissions ${JSON.stringify(permissions)}`, async () => {
    const h = pageHarness({}, null, false, 'group');
    try {
      h.page.startPublish();
      h.store.state.profile = { id: 'alice', token: 'alice-token' };
      await vue.nextTick();
      h.pending.find((p) => p.url === '/me').resolve({ listings: [], ...permissions });
      await flush();
      assert.equal(h.page.editing.value, false);
    } finally {
      h.stop();
    }
  });
}
