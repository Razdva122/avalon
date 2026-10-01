const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
async function requestsFor(userID) {
  const events = [];
  const source = fs
    .readFileSync(require.resolve('../src/components/user/UserHoverCard.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const mock = (id) => {
    if (id === 'vue') return { ...vue, onUnmounted() {} };
    if (id === '@/helpers/composables')
      return { useUserProfile: () => ({ userState: vue.ref({ status: 'loading' }) }) };
    if (id === '@/api/socket')
      return {
        socket: {
          timeout() {
            return this;
          },
          emitWithAck(event) {
            events.push(event);
            return Promise.resolve(event === 'getUserRatings' ? [] : { games: [] });
          },
        },
      };
    if (id === '@/helpers/stats/load-games')
      return { loadPlayerGames: (fetch) => fetch().then((result) => result.games) };
    if (id === '@/helpers/stats')
      return { prepareUserStats: () => ({ teams: { total: { total: 0, winrate: '0.00' } } }) };
    return {};
  };
  new Function('require', 'exports', code)(mock, exports);
  const scope = vue.effectScope();
  const state = scope.run(() => exports.default.setup(vue.reactive({ userID, isVisible: true, compact: false })));
  for (let i = 0; i < 6; i++) await Promise.resolve();
  assert.equal(state.loading.value, false);
  assert.equal(state.totalGames.value, 0);
  scope.stop();
  return events;
}
test('AI hover profiles load their games without human role rankings', async () => {
  for (const userID of ['avalon-agent-3', 'avalon-ai-1'])
    assert.deepEqual(await requestsFor(userID), ['getPlayerGameSummariesPage']);
});
test('human hover profiles retain role rankings', async () => {
  assert.deepEqual(await requestsFor('human'), ['getUserRatings', 'getPlayerGameSummariesPage']);
});
