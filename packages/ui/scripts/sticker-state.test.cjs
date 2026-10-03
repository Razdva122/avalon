const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function setup() {
  const store = { state: vue.reactive({ profile: { id: 'first' } }) };
  let collection = {
    stickers: [{ id: 'servant-wave', available: true, isNew: true, progress: 1, requirement: 1 }],
    favorites: [],
    hideOnBoard: false,
  };
  const pending = [];
  const reads = [];
  let deferRead = false;
  const socket = {
    on() {},
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
      if (event === 'markStickersSeen') {
        collection.stickers.forEach((s) => {
          if (args[0].includes(s.id)) s.isNew = false;
        });
        return true;
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

test('explicit viewing clears the new badge everywhere and keeps it cleared after reload', async () => {
  const {
    consumers: [first, second],
    stop,
  } = setup();
  try {
    await flush();
    await first.markSeen(['servant-wave']);
    assert.equal(second.collection.value.stickers[0].isNew, false);
    await second.load();
    assert.equal(second.collection.value.stickers[0].isNew, false);
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

test('a delayed refresh cannot restore an acknowledged seen badge', async () => {
  const {
    consumers: [first],
    reads,
    deferReads,
    stop,
  } = setup();
  try {
    await flush();
    deferReads();
    const refresh = first.load();
    await first.markSeen(['servant-wave']);
    assert.equal(first.newCount.value, 0);
    reads[0].resolve(reads[0].snapshot);
    await refresh;
    assert.equal(first.newCount.value, 0);
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
