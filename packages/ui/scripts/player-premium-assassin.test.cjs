const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc');
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
  let statusFloatingOptions;
  const exports = {};
  new Function('require', 'exports', 'window', 'document', code)(
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
        return {
          useUserProfile: () => ({ userState: profile, userName: vue.ref(overrides.playerState?.name || 'Owner') }),
        };
      if (id === '@/store') return { useStore: () => store };
      if (id === 'vuetify') return { useTheme: () => ({ themeClasses }) };
      if (id === '@/api/socket') return { socket: { on() {}, off() {} } };
      if (id === '@/helpers/images') return { getImagePathByID: () => '', getThumbnailPathByID: () => '' };
      if (id === '@/helpers/plot-cards') return { getPlayerCards: () => [] };
      if (id === '@floating-ui/vue')
        return {
          useFloating: (_, __, options) => {
            if (options.placement === 'top') statusFloatingOptions = options;
            return {
              middlewareData: vue.ref({}),
              floatingStyles: vue.ref({ position: options.strategy }),
            };
          },
          offset: require('@floating-ui/vue').offset,
          flip: require('@floating-ui/vue').flip,
          shift: require('@floating-ui/vue').shift,
          arrow() {},
        };
      if (id === '@avalon/types/consts') return { availablePlotCards: {} };
      if (id === './BotGameTimer.vue') {
        const filename = require.resolve('../src/components/view/board/modules/BotGameTimer.vue');
        const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
        const script = compileScript(descriptor, { id: 'timer' });
        const template = compileTemplate({
          source: descriptor.template.content,
          filename,
          id: 'timer',
          compilerOptions: { bindingMetadata: script.bindings },
        });
        const timer = {};
        const code = ts.transpileModule(script.content + '\n' + template.code, {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
        new Function('require', 'exports', code)(() => ({ ...vue, onMounted() {}, onBeforeUnmount() {} }), timer);
        timer.default.render = timer.render;
        return { __esModule: true, default: timer.default };
      }
      if (id.endsWith('.vue')) return { __esModule: true, default: { render: () => null } };
      if (id.startsWith('@/') || id.startsWith('./')) return {};
      return require(id);
    },
    exports,
    { matchMedia: () => ({ matches: false }) },
    { querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 64 }) }) },
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
    app.config.globalProperties.$t = (key, params = {}) =>
      ({
        'aiArena.yourDiscussionTurn': 'Ваше слово',
        'aiArena.thinking': 'Думает',
        'aiArena.botActionTime': `Твой ход: ${params.seconds} с`,
        'aiArena.playerActionTime': `Ход: ${params.name} · ${params.seconds} с`,
        'aiArena.playerDiscussionTime': `Слово: ${params.name} · ${params.seconds} с`,
        'aiArena.botDiscussionTime': `Ваше слово: ${params.seconds} с`,
        'aiArena.botReserveTime': `Расходуется запас: ${params.seconds} с`,
        'aiArena.botTimeBankRemaining': `Общий запас: ${params.seconds} с`,
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
  return { api, props, profile, store, themeClasses, render, statusFloatingOptions, stop: () => scope.stop() };
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

test('human deadline renders in the floating player pill, keeps the reserve and clears with the action', async (t) => {
  t.mock.method(Date, 'now', () => 1000000);
  const player = fixture({
    actionTimer: { humanActionExpiresAt: 1390000, humanActionBaseExpiresAt: 1090000, humanTimeBankMs: 300000 },
  });
  t.after(player.stop);
  player.store.state.profile.id = 'owner';
  let rendered = await player.render();
  assert.ok(rendered.badge.includes('Твой ход: 90 с'), rendered.badge);
  assert.ok(rendered.badge.includes('Общий запас: 300 с'), rendered.badge);
  assert.ok(!rendered.html.includes('Твой ход'), 'the clock stays outside the scaled table');
  assert.ok(rendered.badge.includes('<summary'), 'touch and keyboard users can disclose the deadline explanation');
  player.props.actionTimer.waitingForDiscussion = true;
  rendered = await player.render();
  assert.ok(rendered.badge.includes('Ваше слово: 90 с'), rendered.badge);
  assert.ok(rendered.badge.includes('Общий запас: 300 с'), 'discussion shares the action reserve');
  player.props.visibleHistory = { type: 'preVote', votes: [] };
  assert.ok(!(await player.render()).badge.includes('Ваше слово'), 'history suppresses the live deadline');
  player.props.visibleHistory = undefined;
  player.props.actionTimer = undefined;
  assert.ok(!(await player.render()).badge.includes('Твой ход'), 'completed action removes the clock');
});

test('friend and spectator deadlines name the acting player instead of prompting the viewer', async (t) => {
  t.mock.method(Date, 'now', () => 1000000);
  const player = fixture({
    playerState: { id: 'owner', name: 'Аня', features: {} },
    actionTimer: { humanActionExpiresAt: 1090000, withFriend: true },
  });
  t.after(player.stop);
  let rendered = await player.render();
  assert.ok(rendered.badge.includes('Ход: Аня · 90 с'), rendered.badge);
  assert.ok(!rendered.badge.includes('Твой ход'), 'a friend’s action is not the viewer’s turn');
  player.props.actionTimer.waitingForDiscussion = true;
  rendered = await player.render();
  assert.ok(rendered.badge.includes('Слово: Аня · 90 с'), rendered.badge);
  assert.ok(!rendered.badge.includes('Ваше слово'), 'a friend’s discussion is not the viewer’s reply');
  player.store.state.profile.id = 'owner';
  assert.ok((await player.render()).badge.includes('Ваше слово: 90 с'));
  player.store.state.profile = undefined;
  assert.ok((await player.render()).badge.includes('Слово: Аня · 90 с'), 'spectators see the player name');
});

test('top player status stays below the fixed header at desktop and mobile widths', async (t) => {
  const player = fixture({ thinking: true });
  t.after(player.stop);
  const { computePosition } = require('@floating-ui/vue');
  for (const width of [390, 1440]) {
    const result = await computePosition(
      {},
      {},
      {
        ...player.statusFloatingOptions,
        platform: {
          getElementRects: async () => ({
            reference: { x: width / 2 - 40, y: 80, width: 80, height: 100 },
            floating: { x: 0, y: 0, width: 180, height: 32 },
          }),
          getClippingRect: async () => ({ x: 0, y: 0, width, height: 800 }),
          getDimensions: async () => ({ width: 180, height: 32 }),
          isElement: async () => false,
        },
      },
    );
    assert.ok(result.y >= 72, `status at ${result.y} overlaps the header`);
    assert.ok(result.x >= 8 && result.x + 180 <= width - 8);
  }
});
