const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function fixture() {
  const store = vue.reactive({ state: { profile: { id: 'owner' } } });
  const replies = [];
  const cleanup = [];
  let poll;
  const source = fs.readFileSync(require.resolve('../src/helpers/composables/useAiAccess.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const socket = {
    on() {},
    off() {},
    timeout: () => ({ emitWithAck: () => new Promise((resolve) => replies.push(resolve)) }),
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
    store,
    replies,
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
  assert.deepEqual(room.access.botModes.value, { smart: false, regular: false });
});
