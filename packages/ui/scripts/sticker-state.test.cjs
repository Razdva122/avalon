const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const catalog = {};
new Function(
  'exports',
  ts.transpileModule(fs.readFileSync(require.resolve('../../types/user/stickers.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(catalog);

function setup() {
  const listeners = {};
  const store = { state: vue.reactive({ profile: { id: 'first' } }) };
  let collection = {
    stickers: [{ id: 'servant-wave', available: true, progress: 1, requirement: 1 }],
    favorites: [],
    hideOnBoard: false,
  };
  const pending = [];
  const reads = [];
  let deferRead = false;
  const socket = {
    on(event, fn) {
      listeners[event] = fn;
    },
    off() {},
    timeout() {
      return this;
    },
    async emitWithAck(event, ...args) {
      if (event === 'getMyStickers') {
        if (deferRead) return new Promise((resolve) => reads.push({ resolve, snapshot: structuredClone(collection) }));
        return structuredClone(collection);
      }
      if (event === 'updateStickerPreferences') {
        return new Promise((resolve, reject) => pending.push({ resolve, reject, favorites: args[0] }));
      }
      throw Error(`Unexpected ${event}`);
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync(require.resolve('../src/helpers/composables/useStickers.ts'), 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === 'vue') return { ...vue, onMounted: (fn) => fn(), onUnmounted: vue.onScopeDispose };
    if (id === '@vueuse/core') return require('@vueuse/core');
    if (id === '@avalon/types/user/stickers') return catalog;
    if (id === '@/store') return { store };
    if (id === '@/api/socket') return { socket };
    throw Error(id);
  }, exports);
  const scopes = [vue.effectScope(), vue.effectScope()];
  const consumers = scopes.map((scope) => scope.run(exports.useStickers));
  return {
    consumers,
    store,
    pending,
    reads,
    deferReads: () => {
      deferRead = true;
    },
    collection,
    listeners,
    stop: () => scopes.forEach((s) => s.stop()),
  };
}
const flush = async () => {
  for (let i = 0; i < 5; i++) await vue.nextTick();
};

test('favorites saved in a reward are immediately visible in the picker and collection', async () => {
  const {
    consumers: [first, second],
    pending,
    collection,
    stop,
  } = setup();
  try {
    await flush();
    const saving = first.save(['servant-wave']);
    pending[0].resolve({ ...collection, favorites: ['servant-wave'] });
    await saving;
    assert.deepEqual(second.collection.value.favorites, ['servant-wave']);
  } finally {
    stop();
  }
});

test('a save rejection from the previous account cannot pollute the next account', async () => {
  const {
    consumers: [first],
    store,
    pending,
    stop,
  } = setup();
  try {
    await flush();
    const saving = first.save(['servant-wave']);
    store.state.profile = { id: 'second' };
    await flush();
    pending[0].reject(Error('old account disconnected'));
    await saving;
    assert.equal(first.error.value, '');
    assert.equal(first.busy.value, false);
  } finally {
    stop();
  }
});

test('a rejected save ends the obsolete refresh and permits retry', async () => {
  const {
    consumers: [first],
    reads,
    pending,
    deferReads,
    stop,
  } = setup();
  try {
    await flush();
    deferReads();
    const refresh = first.load();
    const saving = first.save(['servant-wave']);
    pending[0].reject(Error('offline'));
    await saving;
    reads[0].resolve(reads[0].snapshot);
    await refresh;
    assert.equal(first.loading.value, false);
    assert.equal(first.error.value, 'failed');
  } finally {
    stop();
  }
});

test('only game updates announce newly available stickers; reconnect and manual loads are silent', async () => {
  const {
    consumers: [first],
    collection,
    listeners,
    stop,
  } = setup();
  try {
    await flush();
    assert.deepEqual(first.unlocked.value, []);
    collection.stickers.push({ id: 'percival-toast', available: true, progress: 5, requirement: 5 });
    await first.load();
    assert.deepEqual(first.unlocked.value, []);
    collection.stickers.push({ id: 'servant-victory', available: true, progress: 10, requirement: 10 });
    listeners.stickersUpdated();
    await flush();
    assert.deepEqual(first.unlocked.value, ['servant-victory']);
    collection.stickers.push({ id: 'oberon-smirk', available: true, progress: 10, requirement: 10 });
    listeners.connect();
    await flush();
    assert.deepEqual(first.unlocked.value, []);
    listeners.stickersUpdated();
    await flush();
    assert.deepEqual(first.unlocked.value, []);
  } finally {
    stop();
  }
});

test('a preference save cannot swallow a concurrent game reward', async () => {
  const {
    consumers: [first],
    pending,
    reads,
    deferReads,
    collection,
    listeners,
    stop,
  } = setup();
  try {
    await flush();
    const saving = first.save(['servant-wave']);
    const oldSnapshot = structuredClone(collection);
    collection.stickers.push({ id: 'percival-toast', available: true, progress: 5, requirement: 5 });
    deferReads();
    listeners.stickersUpdated();
    pending[0].resolve({ ...oldSnapshot, favorites: ['servant-wave'] });
    await saving;
    for (const read of reads) read.resolve(read.snapshot);
    await flush();
    assert.deepEqual(first.unlocked.value, ['percival-toast']);
    assert.equal(
      first.collection.value.stickers.some((s) => s.id === 'percival-toast'),
      true,
    );
  } finally {
    stop();
  }
});

test('premium availability changes are not announced as game rewards', async () => {
  const {
    consumers: [first],
    collection,
    listeners,
    stop,
  } = setup();
  try {
    await flush();
    collection.stickers.push({ id: 'mordred-puppet', available: true, progress: 1, requirement: 1 });
    listeners.stickersUpdated();
    await flush();
    assert.deepEqual(first.unlocked.value, []);
  } finally {
    stop();
  }
});

test('a rejected preference acknowledgement preserves a concurrent reward refresh', async () => {
  const {
    consumers: [first],
    pending,
    reads,
    deferReads,
    collection,
    listeners,
    stop,
  } = setup();
  try {
    await flush();
    const saving = first.save(['servant-wave']);
    collection.stickers.push({ id: 'percival-toast', available: true, progress: 5, requirement: 5 });
    deferReads();
    listeners.stickersUpdated();
    pending[0].resolve({ error: 'failed' });
    assert.equal(await saving, false);
    reads[0].resolve(reads[0].snapshot);
    await flush();
    assert.deepEqual(first.unlocked.value, ['percival-toast']);
  } finally {
    stop();
  }
});
