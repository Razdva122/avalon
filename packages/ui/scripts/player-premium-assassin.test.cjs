const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileTemplate } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');

function fixture(overrides = {}) {
  const profile = vue.ref({ status: 'loading' });
  const game = vue.ref({ stage: 'assassinate', players: [] });
  const store = vue.reactive({ state: { profile: { id: 'viewer', premium: true } } });
  const themeClasses = vue.ref('v-theme--lightTheme');
  const source = fs.readFileSync(require.resolve('../src/components/view/board/modules/Player.vue'), 'utf8');
  const code = ts.transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', 'window', code)(
    (id) => {
      if (id === 'vue')
        return {
          ...vue,
          inject: (key, fallback) => (key === 'game' ? game : fallback),
          onMounted() {},
          onUnmounted() {},
        };
      if (id === '@/helpers/game-state-manager') return { gameStateKey: 'game' };
      if (id === '@/helpers/composables')
        return { useUserProfile: () => ({ userState: profile, userName: vue.ref('Owner') }) };
      if (id === '@/store') return { useStore: () => store };
      if (id === 'vuetify') return { useTheme: () => ({ themeClasses }) };
      if (id === '@/api/socket') return { socket: { on() {}, off() {} } };
      if (id === '@/helpers/images') return { getImagePathByID: () => '', getThumbnailPathByID: () => '' };
      if (id === '@/helpers/plot-cards') return { getPlayerCards: () => [] };
      if (id === '@floating-ui/vue')
        return {
          useFloating: (_, __, options) => ({
            middlewareData: vue.ref({}),
            floatingStyles: vue.ref({ position: options.strategy }),
          }),
          offset() {},
          flip() {},
          shift() {},
          arrow() {},
        };
      if (id === '@avalon/types/consts') return { availablePlotCards: {} };
      if (id.endsWith('.vue')) return { __esModule: true, default: { render: () => null } };
      if (id.startsWith('@/') || id.startsWith('./')) return {};
      return require(id);
    },
    exports,
    { matchMedia: () => ({ matches: false }) },
  );
  const props = vue.reactive({
    visibleHistory: undefined,
    displayKick: false,
    thinking: false,
    discussionTurn: false,
    playerState: { id: 'owner', features: { isAssassin: true } },
    ...overrides,
  });
  const scope = vue.effectScope();
  const api = scope.run(() => exports.default.setup(props));
  const template = compileTemplate({
    source: parse(source).descriptor.template.content,
    filename: 'Player.vue',
    id: 'player',
  });
  assert.deepEqual(template.errors, []);
  const renderer = {};
  const templateCode = ts.transpileModule(template.code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'exports', templateCode)(require, renderer);
  async function render() {
    const context = {};
    const app = vue.createSSRApp({ ...exports.default, setup: () => api, render: renderer.render }, props);
    app.config.globalProperties.$t = (key) =>
      ({
        'aiArena.yourDiscussionTurn': 'Ваше слово',
        'aiArena.thinking': 'Думает',
      })[key] || key;
    app.component('v-tooltip', {
      inheritAttrs: false,
      render() {
        return this.$slots.activator?.({ props: {} });
      },
    });
    app.component('v-dialog', { render: () => null });
    app.component('v-btn', { render: () => null });
    return { html: await renderToString(app, context), badge: context.teleports?.body || '' };
  }
  return { api, props, profile, store, themeClasses, render, stop: () => scope.stop() };
}

test('assassin fire follows the owner premium profile and current player state', () => {
  const { api, profile, props, stop } = fixture();
  try {
    assert.ok(api.showPremiumAssassin, 'the component exposes the premium effect gate');
    assert.equal(api.showPremiumAssassin.value, false, 'loading profile must not enable premium');
    profile.value = { status: 'ready', profile: { premium: false } };
    assert.equal(api.showPremiumAssassin.value, false, 'viewer premium must not decorate an ordinary owner');
    profile.value.profile.premium = true;
    assert.equal(api.showPremiumAssassin.value, true);
    props.playerState.features.isSelected = true;
    assert.equal(api.showPremiumAssassin.value, true, 'selection must preserve fire');
    props.playerState.features.isAssassin = false;
    assert.equal(api.showPremiumAssassin.value, false, 'fire stops when assassination ends');
  } finally {
    stop();
  }
});

test('discussion status appears above only the signed-in human and disappears when the turn ends', async (t) => {
  const player = fixture({ discussionTurn: true });
  t.after(player.stop);
  player.store.state.profile.id = 'owner';
  let rendered = await player.render();
  assert.ok(rendered.badge.includes('Ваше слово'), 'the human receives their reply cue');
  assert.ok(!rendered.html.includes('Ваше слово'), 'the pill escapes the rotating table through Teleport');
  assert.ok(rendered.badge.includes('position:fixed'), 'the pill uses viewport coordinates');
  assert.ok(!rendered.badge.includes('thinking-dots'), 'human speech is not a bot-thinking animation');
  player.props.discussionTurn = false;
  rendered = await player.render();
  assert.ok(!rendered.badge.includes('Ваше слово'), 'the completed turn removes the cue');
});

test('discussion status is private to the current player and absent in history or after logout', async (t) => {
  const player = fixture({ discussionTurn: true });
  t.after(player.stop);
  assert.ok(!(await player.render()).badge.includes('Ваше слово'), 'spectators never see a personal prompt');
  player.store.state.profile.id = 'owner';
  player.props.visibleHistory = { type: 'preVote', votes: [] };
  assert.ok(!(await player.render()).badge.includes('Ваше слово'), 'history never asks for a live reply');
  player.props.visibleHistory = undefined;
  player.store.state.profile = undefined;
  assert.ok(!(await player.render()).badge.includes('Ваше слово'), 'logout removes the personal prompt');
});

test('bot thinking retains its dots in the same floating status pill and follows theme changes', async (t) => {
  const player = fixture({ thinking: true });
  t.after(player.stop);
  let rendered = await player.render();
  assert.ok(rendered.badge.includes('Думает'), 'thinking renders above the table');
  assert.ok(rendered.badge.includes('thinking-dots'), 'thinking keeps the animated dots');
  assert.ok(rendered.badge.includes('v-theme--lightTheme'), 'teleported status receives theme variables');
  player.themeClasses.value = 'v-theme--darkTheme';
  rendered = await player.render();
  assert.ok(rendered.badge.includes('v-theme--darkTheme'), 'the pill follows a theme toggle');
  player.props.thinking = false;
  assert.ok(!(await player.render()).badge.includes('Думает'), 'completed inference removes the status');
});
