const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function fixture() {
  const store = vue.reactive({ state: { profile: { id: 'owner' } } });
  const replies = [];
  const failures = [];
  const cleanup = [];
  let poll;
  const source = fs.readFileSync(require.resolve('../src/helpers/composables/useAiAccess.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const socket = {
    on() {},
    off() {},
    timeout: () => ({
      emitWithAck: () =>
        new Promise((resolve, reject) => {
          replies.push(resolve);
          failures.push(reject);
        }),
    }),
  };
  new Function('require', 'exports', 'setInterval', 'clearInterval', code)(
    (id) => {
      if (id === 'vue') return { ...vue, onBeforeUnmount: (callback) => cleanup.push(callback) };
      if (id === '@/api/socket') return { socket };
      if (id === '@/store') return { useStore: () => store };
      throw new Error(`Unexpected import: ${id}`);
    },
    exports,
    (callback) => {
      poll = callback;
      return 1;
    },
    () => {},
  );
  const scope = vue.effectScope();
  const access = scope.run(() => exports.useAiAccess());
  return {
    access,
    anotherConsumer: () => scope.run(() => exports.useAiAccess()),
    store,
    replies,
    failures,
    poll: () => poll(),
    stop: () => {
      cleanup.forEach((callback) => callback());
      scope.stop();
    },
  };
}

test('polling cannot invalidate a slower successful bot access request', async (t) => {
  const room = fixture();
  t.after(room.stop);
  room.poll();
  room.poll();
  assert.equal(room.replies.length, 1, 'overlapping polls must share the pending access request');
  room.replies[0]({ canManage: false, canPlay: true, botModes: { smart: false, regular: true } });
  await Promise.resolve();
  assert.equal(room.access.canPlay.value, true);
  assert.deepEqual(room.access.botModes.value, { smart: false, regular: true });
  room.poll();
  assert.equal(room.replies.length, 2, 'the next poll can refresh after completion');
});

test('AI access distinguishes initial loading, a resolved unavailable mode and transport failure', async (t) => {
  const room = fixture();
  t.after(room.stop);
  assert.equal(room.access.accessStatus.value, 'loading');
  room.replies[0]({ canManage: false, canPlay: true, botModes: { smart: false, regular: false } });
  await Promise.resolve();
  assert.equal(room.access.accessStatus.value, 'ready');
  room.poll();
  assert.equal(room.access.accessStatus.value, 'ready', 'background refresh must not flicker initial loading');
  room.failures[1](Error('offline'));
  await Promise.resolve();
  assert.equal(room.access.accessStatus.value, 'error');
});

test('logout clears public bot access and rejects the late response from the previous profile', async (t) => {
  const room = fixture();
  t.after(room.stop);
  room.replies[0]({
    canManage: false,
    canPlay: true,
    botModes: { smart: true, regular: true },
    ownRoomID: 'own-match',
  });
  await Promise.resolve();
  assert.equal(room.access.ownRoomID.value, 'own-match');
  room.poll();
  room.store.state.profile = undefined;
  await vue.nextTick();
  room.replies[1]({
    canManage: false,
    canPlay: true,
    botModes: { smart: true, regular: true },
    ownRoomID: 'own-match',
  });
  await Promise.resolve();
  assert.equal(room.access.canPlay.value, false);
  assert.equal(room.access.ownRoomID.value, undefined);
  assert.deepEqual(room.access.botModes.value, { smart: false, regular: false, beginner: false });
});

test('occupied bot access clears its reason after the slot opens or connection fails', async (t) => {
  const room = fixture();
  t.after(room.stop);
  room.replies[0]({ canManage: false, canPlay: true, botsBusy: true, botModes: { smart: false, regular: false } });
  await Promise.resolve();
  assert.equal(room.access.botsBusy.value, true);
  room.poll();
  room.replies[1]({ canManage: false, canPlay: true, botModes: { smart: false, regular: true } });
  await Promise.resolve();
  assert.equal(room.access.botsBusy.value, false);
  room.poll();
  room.replies[2]({ canManage: false, canPlay: true, botsBusy: true, botModes: { smart: false, regular: false } });
  await Promise.resolve();
  room.poll();
  room.failures[3](Error('offline'));
  await Promise.resolve();
  assert.equal(room.access.botsBusy.value, false);
  assert.equal(room.access.accessStatus.value, 'error');
});

test('a newly mounted AI control reuses confirmed access while its background response is pending', async (t) => {
  const room = fixture();
  t.after(room.stop);
  room.replies[0]({
    canManage: false,
    canPlay: true,
    botModes: { smart: false, regular: true },
    botModeAvailableAt: { smart: 2000000000000 },
  });
  await Promise.resolve();
  const next = room.anotherConsumer();
  assert.equal(next.accessStatus.value, 'ready');
  assert.equal(next.canPlay.value, true);
  assert.deepEqual(next.botModes.value, { smart: false, regular: true });
  assert.deepEqual(next.botModeAvailableAt.value, { smart: 2000000000000 });
  assert.equal(room.replies.length, 2, 'fresh access is still requested');
  room.store.state.profile = { id: 'other' };
  await vue.nextTick();
  assert.equal(next.accessStatus.value, 'loading');
  assert.equal(next.canPlay.value, false, 'cached access cannot cross identities');
});

test('a cached AI response expires instead of showing stale permission indefinitely', async (t) => {
  let now = 1000000;
  t.mock.method(Date, 'now', () => now);
  const room = fixture();
  t.after(room.stop);
  room.replies[0]({ canManage: false, canPlay: true, botModes: { smart: true, regular: true } });
  await Promise.resolve();
  now += 61000;
  const next = room.anotherConsumer();
  assert.equal(next.accessStatus.value, 'loading');
  assert.equal(next.canPlay.value, false);
});

test('quota waits use hours rounded up to a tenth and update during polling', async (t) => {
  let now = 1000000000;
  t.mock.method(Date, 'now', () => now);
  const room = fixture();
  t.after(room.stop);
  room.replies[0]({
    canManage: false,
    canPlay: true,
    botModes: { smart: false, regular: true },
    botModeAvailableAt: { smart: 1008640000 },
  });
  await Promise.resolve();
  assert.equal(room.access.botWaitHours.value.smart, 2.4);
  now += 7200000;
  room.poll();
  assert.equal(room.access.botWaitHours.value.smart, 0.4);
  now += 1440000;
  room.poll();
  assert.equal(
    room.access.botWaitHours.value.smart,
    undefined,
    'expired predictions cannot say available while permission is still denied',
  );
});
