const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

test('assassin fire follows the owner premium profile and current player state', () => {
  const profile = vue.ref({ status: 'loading' });
  const game = vue.ref({ stage: 'assassinate', players: [] });
  const source = fs.readFileSync(require.resolve('../src/components/view/board/modules/Player.vue'), 'utf8');
  const code = ts.transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
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
    if (id === '@/store') return { useStore: () => ({ state: { profile: { id: 'viewer', premium: true } } }) };
    if (id === '@/api/socket') return { socket: { on() {}, off() {} } };
    if (id === '@floating-ui/vue')
      return { useFloating: () => ({ middlewareData: vue.ref({}) }), offset() {}, flip() {}, shift() {}, arrow() {} };
    if (id === '@avalon/types/consts') return { availablePlotCards: {} };
    if (id.startsWith('@/') || id.startsWith('./')) return {};
    return require(id);
  }, exports);
  const props = vue.reactive({
    visibleHistory: undefined,
    displayKick: false,
    playerState: { id: 'owner', features: { isAssassin: true } },
  });
  const scope = vue.effectScope();
  try {
    const api = scope.run(() => exports.default.setup(props));
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
    scope.stop();
  }
});
