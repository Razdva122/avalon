const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function profile() {
  const source = fs.readFileSync(require.resolve('../src/pages/profile/Profile.vue'), 'utf8');
  const script = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(script, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === 'vue') return require('vue');
    if (id === '@/router/paths') return require('../src/router/paths');
    if (id === '@/plugins/i18n') return { i18n: { global: { locale: { value: 'ru' } } } };
    return {};
  }, exports);
  const actions = [];
  const state = {
    logoutDialog: false,
    $router: { push: (path) => actions.push(['navigate', path]) },
    $store: { commit: (mutation) => actions.push(['commit', mutation]) },
  };
  for (const [name, method] of Object.entries(exports.default.methods)) state[name] = method.bind(state);
  return { state, actions };
}

test('requesting logout leaves the account active until explicit confirmation', () => {
  const { state, actions } = profile();
  state.logout();
  assert.deepEqual(actions, []);
  assert.equal(state.logoutDialog, true);
  state.confirmLogout();
  assert.equal(state.logoutDialog, false);
  assert.deepEqual(actions, [
    ['navigate', '/ru/'],
    ['commit', 'clearUserProfile'],
  ]);
  state.confirmLogout();
  assert.equal(actions.length, 2, 'a second click must not repeat logout');
});

test('dismissing the dialog keeps the account active and a new request can reopen it', () => {
  const { state, actions } = profile();
  state.logout();
  state.logoutDialog = false;
  state.confirmLogout();
  assert.deepEqual(actions, []);
  state.logout();
  assert.equal(state.logoutDialog, true);
  assert.deepEqual(actions, []);
});
