const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
function setupPage() {
  const pending = [];
  const socket = {
    emitWithAck: (event, uuid) => new Promise((resolve, reject) => pending.push({ event, uuid, resolve, reject })),
    timeout() {
      return this;
    },
  };
  const source = fs
    .readFileSync(require.resolve('../src/pages/stats/UserStats.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const emptyStats = { teams: { total: { total: 0, wins: 0, lose: 0, winrate: '0' } } };
  const requireMock = (id) => {
    if (id === 'vue') return { ...vue, onUnmounted() {} };
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
    if (id === 'vue-router') return { useRouter: () => ({ push() {} }) };
    if (id === '@/helpers/composables') return { useResponsive: () => ({ isMobile: vue.ref(false) }) };
    if (id === '@/api/socket') return { socket };
    if (id === '@/helpers/stats')
      return {
        prepareUserStats: (games) => ({ ...emptyStats, marker: games[0]?.uuid }),
        prepareGamesForView: (games) => games.map((game) => ({ gameID: game.uuid })),
        preparePlayerStats: () => [],
      };
    return {};
  };
  new Function('require', 'exports', code)(requireMock, exports);
  const props = vue.reactive({ uuid: 'first' });
  const scope = vue.effectScope();
  const page = scope.run(() => exports.default.setup(props));
  return { page, props, pending, stop: () => scope.stop() };
}
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};
test('page displays loading immediately and statistics do not wait for rating requests', async () => {
  const { page, pending, stop } = setupPage();
  assert.equal(typeof page.then, 'undefined', 'setup must not block rendering');
  assert.equal(page.loading.value, true);
  pending[0].resolve([{ uuid: 'game' }]);
  await flush();
  assert.equal(page.loading.value, false);
  assert.equal(page.lastGames.value[0].gameID, 'game');
  assert.equal(pending[1].event, 'getMatchTrueSkillChanges');
  pending[1].reject(Error('offline'));
  await flush();
  assert.equal(page.lastGames.value[0].gameID, 'game');
  stop();
});
test('late response cannot replace the next user and a failed load can be retried', async () => {
  const { page, props, pending, stop } = setupPage();
  assert.equal(typeof page.then, 'undefined');
  props.uuid = 'second';
  await vue.nextTick();
  pending[1].resolve([]);
  await flush();
  pending[0].resolve([{ uuid: 'stale' }]);
  await flush();
  assert.deepEqual(page.lastGames.value, []);
  props.uuid = 'third';
  await vue.nextTick();
  pending[2].reject(Error('offline'));
  await flush();
  assert.equal(page.loading.value, false);
  assert.equal(page.loadError.value, true);
  page.retry();
  assert.equal(page.loading.value, true);
  pending[3].resolve([]);
  await flush();
  assert.equal(page.loadError.value, false);
  stop();
});

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS', experimentalDecorators: true },
});
const { prepareUserStats, prepareGamesForView, preparePlayerStats } = require('../src/helpers/stats/index.ts');
test('compact game records preserve totals, recent games and teammate statistics without mutating order', () => {
  const games = [
    {
      uuid: 'old',
      players: [
        { id: 'user', role: 'merlin' },
        { id: 'friend', role: 'servant' },
        { id: 'enemy', role: 'mordred' },
      ],
      result: { winner: 'good' },
    },
    {
      uuid: 'new',
      players: [
        { id: 'user', role: 'mordred' },
        { id: 'friend', role: 'merlin' },
        { id: 'enemy', role: 'morgana' },
      ],
      result: { winner: 'good' },
    },
  ];
  assert.deepEqual(prepareUserStats(games, 'user').teams.total, { total: 2, wins: 1, lose: 1, winrate: '50.00' });
  assert.deepEqual(prepareGamesForView(games, 'user', 1), [{ role: 'mordred', isWin: false, gameID: 'new' }]);
  assert.deepEqual(
    games.map((game) => game.uuid),
    ['old', 'new'],
  );
  assert.deepEqual(preparePlayerStats(games, 'user', 'teammate'), [
    { id: 'friend', gamesCount: 1, wins: 1, lose: 0, winrate: '100.00' },
    { id: 'enemy', gamesCount: 1, wins: 0, lose: 1, winrate: '0.00' },
  ]);
  assert.deepEqual(prepareGamesForView(games, 'user', 0), []);
  assert.equal(prepareUserStats([], 'user').teams.total.winrate, '0.00');
});
