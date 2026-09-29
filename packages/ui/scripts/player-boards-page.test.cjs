const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const types = require('../../types/player-board.ts');
function pageHarness() {
  const pending = [],
    mounted = [],
    unmounted = [];
  const store = { state: vue.reactive({ profile: { id: 'alice', token: 'alice-token' } }) };
  const file = path.resolve(__dirname, '../src/pages/community/PlayerBoards.vue');
  const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
  const script = compileScript(descriptor, { id: file });
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const customRequire = (id) => {
    if (id === 'vue')
      return { ...vue, onMounted: (cb) => mounted.push(cb), onBeforeUnmount: (cb) => unmounted.push(cb) };
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
    if (id === '@/store') return { useStore: () => store };
    if (id === '@/api/player-boards')
      return {
        boardRequest: (url, method, body) =>
          new Promise((resolve, reject) => pending.push({ url, method, body, resolve, reject })),
      };
    if (id === '@avalon/types/player-board') return types;
    if (id === './board-helpers') return require('../src/pages/community/board-helpers.ts');
    if (id === '@/helpers/prerender') return { prerender: false };
    if (id === '@/helpers/event-bus') return { default: { emit() {} } };
    return {};
  };
  new Function('require', 'module', 'exports', code)(customRequire, module, module.exports);
  const scope = vue.effectScope();
  const page = scope.run(() => module.exports.default.setup({}, { expose() {} }));
  mounted.forEach((cb) => cb());
  return {
    page,
    store,
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
