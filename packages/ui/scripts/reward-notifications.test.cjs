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
  const unlocked = vue.ref([]);
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
      if (id === '@/helpers/composables/useStickers') return { useStickers: () => ({ collection, unlocked }) };
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
  return { page, profile, collection, unlocked, timers, listeners, setCollection, stop: () => scope.stop() };
}

const sticker = (id, available = true) => ({ id, available, progress: 1, requirement: 1 });

test('initial load and account changes never announce existing rewards', async () => {
  const { page, profile, setCollection, stop } = setup();
  try {
    setCollection([sticker('servant-wave')]);
    await vue.nextTick();
    assert.equal(page.popups.value.length, 0);
    profile.id = 'second';
    await vue.nextTick();
    setCollection([sticker('servant-wave')]);
    await vue.nextTick();
    assert.equal(page.popups.value.length, 0);
  } finally {
    stop();
  }
});

test('live rewards merge into one notification and achievement stickers are counted once', async () => {
  const { page, listeners, unlocked, stop } = setup();
  try {
    listeners.achievementUnlocked('light_wins');
    unlocked.value = ['servant-victory', 'servant-wave'];
    await vue.nextTick();
    listeners.achievementUnlocked('dark_wins');
    assert.equal(page.popups.value.length, 1);
    assert.deepEqual(page.popups.value[0].achievementIDs, ['light_wins', 'dark_wins']);
    assert.deepEqual(page.popups.value[0].stickerIDs, ['servant-victory', 'servant-wave']);
  } finally {
    stop();
  }
});

test('closing a live notification prevents duplicate events from reopening it', async () => {
  const { page, listeners, unlocked, stop } = setup();
  try {
    listeners.achievementUnlocked('light_wins');
    await vue.nextTick();
    page.closePopup(page.popups.value[0].id);
    listeners.achievementUnlocked('light_wins');
    unlocked.value = ['servant-victory'];
    await vue.nextTick();
    assert.equal(page.popups.value.length, 0);
    unlocked.value = ['servant-wave'];
    await vue.nextTick();
    assert.equal(page.popups.value.length, 1);
  } finally {
    stop();
  }
});

test('progress does not create a notification and logout clears active rewards', async () => {
  const { page, profile, listeners, stop } = setup();
  try {
    listeners.achievementProgress?.({ achievementID: 'light_wins', currentProgress: 1, requirement: 10 });
    assert.equal(page.popups.value.length, 0);
    listeners.achievementUnlocked('light_wins');
    profile.id = undefined;
    await vue.nextTick();
    assert.equal(page.popups.value.length, 0);
    listeners.achievementUnlocked('dark_wins');
    assert.equal(page.popups.value.length, 0);
  } finally {
    stop();
  }
});
