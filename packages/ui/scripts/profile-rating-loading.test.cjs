const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
function setupRating() {
  const pending = [];
  const source = fs
    .readFileSync(require.resolve('../src/components/stats/UserTrueSkillRating.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(
    (id) =>
      id === 'vue'
        ? { ...vue, onMounted: (fn) => fn(), onUnmounted() {} }
        : { socket: { emit: (event, id, callback) => pending.push({ id, callback }) } },
    exports,
  );
  const props = vue.reactive({ userID: 'first' });
  const scope = vue.effectScope();
  const state = scope.run(() => exports.default.setup(props));
  return { pending, props, scope, state };
}

test('an empty rating ends loading without showing an error for a new account', () => {
  const { pending, scope, state } = setupRating();
  pending[0].callback({ success: true });
  assert.equal(state.loading.value, false);
  assert.equal(state.trueSkillRating.value, null);
  assert.equal(state.error.value, '');
  scope.stop();
});

test('rating load failures still report an error', () => {
  const { pending, scope, state } = setupRating();
  pending[0].callback({ success: false, error: 'requestFailed' });
  assert.equal(state.loading.value, false);
  assert.equal(state.error.value, 'requestFailed');
  scope.stop();
});

test('rating switches users without stale values and ignores late responses', async () => {
  const { pending, props, scope, state } = setupRating();
  pending[0].callback({ success: true, rating: { mu: 6100 } });
  props.userID = 'second';
  await vue.nextTick();
  assert.equal(state.trueSkillRating.value, null);
  props.userID = 'third';
  await vue.nextTick();
  pending[2].callback({ success: true, rating: { mu: 6300 } });
  pending[1].callback({ success: true, rating: { mu: 6200 } });
  assert.equal(state.trueSkillRating.value.mu, 6300);
  scope.stop();
});
