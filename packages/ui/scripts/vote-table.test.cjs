const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const file = require.resolve('../src/components/view/information/history/VoteTable.vue');
const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
const script = compileScript(descriptor, { id: 'vote-table', inlineTemplate: true });
const output = { exports: {} };
new Function(
  'require',
  'module',
  'exports',
  ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
)(
  (id) => {
    if (id === '@/components/view/information/const') return { rolesShortInfo: { servant: { loyalty: 'good' } } };
    if (id === '@/helpers/history-groups') return require('../src/helpers/history-groups.ts');
    return require(id);
  },
  output,
  output.exports,
);
const vote = (index, result = 'approve', forced = false) => ({
  type: 'vote',
  index,
  result,
  forced,
  anonymous: false,
  leaderID: 'a',
  team: [{ id: 'a' }, { id: 'b' }],
  votes: [
    { playerID: 'a', value: 'approve' },
    { playerID: 'b', value: 'approve' },
  ],
});
const mission = { type: 'mission', index: 0, result: 'success', fails: 0, excludedPlayerID: 'b', actions: [] };
async function render(history, gameEnded = false) {
  const app = Vue.createSSRApp(output.exports.default, {
    history,
    gameEnded,
    players: [
      { id: 'a', index: 1, role: 'servant' },
      { id: 'b', index: 2, role: 'servant' },
    ],
    playerNames: { a: 'Alice', b: 'Bob' },
  });
  app.use(
    createI18n({
      legacy: false,
      locale: 'ru',
      messages: {
        ru: {
          ...require('../src/i18n/langs/ru/history.ts').default,
          trapper: require('../src/i18n/langs/trapper.ts').trapper.ru,
        },
      },
      missingWarn: false,
    }),
  );
  return renderToString(app);
}

test('Only the final sent team marks its excluded card, preserving participation and accessible label', async () => {
  const html = await render([vote(0, 'reject'), vote(1), mission]);
  const cells = [...html.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/g)].map((match) => match[0]);
  const excluded = cells.filter((cell) => cell.includes('excluded-card'));
  assert.equal(excluded.length, 1);
  assert.match(excluded[0], /Bob, В команде, Карта исключена/);
  assert.match(excluded[0], /✓/);
  assert.match(excluded[0], /⊘/);
});

test('Forced teams and hidden action lists retain the public exclusion marker', async () => {
  const html = await render([vote(4, 'approve', true), { ...mission, hidden: true }]);
  assert.match(html, /class="excluded-card"/);
});

test('An exclusion is visible while mission resolution is still pending', async () => {
  const html = await render([vote(0), { type: 'discardMissionCard', leaderID: 'a', targetID: 'b', result: 'fail' }]);
  assert.match(html, /class="excluded-card"/);
});

test('Table never renders card values, even for leader or after game end', async () => {
  const history = (value) => [
    vote(0),
    { type: 'discardMissionCard', leaderID: 'a', targetID: 'b', result: value },
    { ...mission, actions: [{ playerID: 'b', discarded: true, value }] },
  ];
  for (const ended of [false, true]) {
    assert.equal(await render(history('fail'), ended), await render(history('success'), ended));
  }
});

test('A hidden final proposal never attaches the marker to an earlier visible approval', async () => {
  const html = await render([vote(0), { type: 'hidden' }, mission]);
  assert.doesNotMatch(html, /class="excluded-card"/);
});
