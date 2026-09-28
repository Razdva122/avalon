const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function panel(dispatch, random = Math.random) {
  const source = fs
    .readFileSync(require.resolve('../src/components/dev/DevPanel.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'Math', code)(
    (id) => (id === '@/store' ? { useStore: () => ({ dispatch }) } : require(id)),
    module,
    module.exports,
    { random },
  );
  const state = module.exports.default.setup();
  state.isPanelOpen.value = true;
  return state;
}

test('test account creation waits for success and ignores repeated clicks while pending', async () => {
  let finish;
  let calls = 0;
  const state = panel(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const pending = state.createFakeAccount();
  assert.equal(state.isPanelOpen.value, true);
  await state.createFakeAccount();
  assert.equal(calls, 1);
  finish({ id: 'new-user' });
  await pending;
  assert.equal(state.isPanelOpen.value, false);
  assert.equal(state.isCreating.value, false);
});

test('registration rejection remains visible and can be retried', async () => {
  let result = { error: 'rateLimited' };
  const state = panel(async () => result);
  await state.createFakeAccount();
  assert.equal(state.isPanelOpen.value, true);
  assert.equal(state.error.value, 'rateLimited');
  assert.equal(state.isCreating.value, false);
  result = { id: 'new-user' };
  await state.createFakeAccount();
  assert.equal(state.error.value, '');
  assert.equal(state.isPanelOpen.value, false);
});

test('transport failures release the button and show a retryable error', async () => {
  const state = panel(async () => {
    throw new Error('timeout');
  });
  await assert.doesNotReject(state.createFakeAccount());
  assert.equal(state.isPanelOpen.value, true);
  assert.equal(state.error.value, 'requestFailed');
  assert.equal(state.isCreating.value, false);
});

test('generated accounts have valid credentials even when Math.random returns a short fraction', async () => {
  const accounts = [];
  const state = panel(
    async (action, payload) => {
      assert.equal(action, 'registerUser');
      accounts.push(payload);
      return { id: 'new-user' };
    },
    () => 0.5,
  );
  await state.createFakeAccount();
  await state.createFakeAccount();
  for (const account of accounts) {
    assert.ok(account.password.length >= 8 && account.password.length <= 72);
    assert.match(account.login, /^[a-zA-Z0-9_.-]+$/);
    assert.match(account.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    assert.ok(account.name.trim().length > 0);
  }
  assert.notEqual(accounts[0].login, accounts[1].login);
  assert.notEqual(accounts[0].email, accounts[1].email);
});
