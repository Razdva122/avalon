const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function setup() {
  const listeners = {};
  const timers = [];
  const profile = vue.reactive({ id: 'first' });
  const collection = vue.ref();
  const source = fs
    .readFileSync(require.resolve('../src/components/achievements/AchievementPopupsContainer.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', 'setTimeout', 'clearTimeout', code)(
    (id) => {
      if (id === 'vue') return { ...vue, onMounted: (fn) => fn(), onUnmounted: vue.onScopeDispose };
      if (id === '@/api/socket')
        return {
          socket: {
            on: (key, fn) => {
              listeners[key] = fn;
            },
            off() {},
          },
        };
      if (id === '@/store') return { store: { state: { profile } } };
      if (id === '@/helpers/composables/useStickers') return { useStickers: () => ({ collection }) };
      if (id === '@avalon/types/user/stickers')
        return { STICKERS: [{ id: 'servant-victory', achievement: 'light_wins' }] };
      if (id === 'uuid') return { v4: () => `id-${Math.random()}` };
      throw Error(id);
    },
    exports,
    (fn) => {
      timers.push(fn);
      return timers.length;
    },
    () => {},
  );
  const scope = vue.effectScope();
  const page = scope.run(() => exports.default.setup());
  const setCollection = (stickers) => {
    collection.value = { stickers, favorites: [], hideOnBoard: false };
  };
  return { page, profile, collection, timers, listeners, setCollection, stop: () => scope.stop() };
}

test('unread stickers from the first load appear globally; dismissal preserves their new status', async () => {
  const { page, collection, setCollection, stop } = setup();
  try {
    setCollection([{ id: 'servant-wave', available: true, isNew: true, progress: 1, requirement: 1 }]);
    await vue.nextTick();
    assert.deepEqual(
      page.popups.value.map((p) => p.stickerIDs),
      [['servant-wave']],
    );
    page.closePopup(page.popups.value[0].id);
    assert.equal(collection.value.stickers[0].isNew, true);
    await vue.nextTick();
    assert.equal(page.popups.value.length, 0);
  } finally {
    stop();
  }
});

test('achievement rewards share one notification instead of announcing the sticker twice', async () => {
  const { page, listeners, setCollection, stop } = setup();
  try {
    listeners.achievementUnlocked('light_wins');
    setCollection([{ id: 'servant-victory', available: true, isNew: true, progress: 10, requirement: 10 }]);
    await vue.nextTick();
    assert.equal(page.popups.value.length, 1);
    assert.equal(page.popups.value[0].achievementID, 'light_wins');
  } finally {
    stop();
  }
});

test('logging into another account clears notifications and restores its unread rewards', async () => {
  const { page, profile, setCollection, stop } = setup();
  try {
    setCollection([{ id: 'servant-wave', available: true, isNew: true, progress: 1, requirement: 1 }]);
    await vue.nextTick();
    profile.id = 'second';
    await vue.nextTick();
    setCollection([{ id: 'servant-wave', available: true, isNew: true, progress: 1, requirement: 1 }]);
    await vue.nextTick();
    assert.equal(page.popups.value.length, 1);
    assert.deepEqual(page.popups.value[0].stickerIDs, ['servant-wave']);
  } finally {
    stop();
  }
});
