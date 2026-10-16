const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Vue = require('vue');
const { parse, compileTemplate } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
const { createI18n } = require('vue-i18n');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });

test('history groups keep rejected teams and addons with their mission and separate assassination', () => {
  const { groupHistory } = require('../src/helpers/history-groups.ts');
  const events = [
    { type: 'vote', index: 0 },
    { type: 'kingReturns' },
    { type: 'vote', index: 1 },
    { type: 'mission', index: 0, result: 'success' },
    { type: 'checkLoyalty' },
    { type: 'vote', index: 0 },
    { type: 'mission', index: 1, result: 'fail' },
    { type: 'assassinate' },
  ];
  const groups = groupHistory(events);
  assert.deepEqual(
    groups.map((g) => [g.kind, g.index, g.entries.map((e) => e.type)]),
    [
      ['mission', 0, ['vote', 'kingReturns', 'vote', 'mission']],
      ['mission', 1, ['checkLoyalty', 'vote', 'mission']],
      ['finale', null, ['assassinate']],
    ],
  );
});

test('unfinished history has no result and hidden votes preserve known mission boundaries', () => {
  const { groupHistory } = require('../src/helpers/history-groups.ts');
  assert.deepEqual(groupHistory([]), []);
  const hidden = groupHistory([{ type: 'hidden' }, { type: 'vote', index: 2 }]);
  assert.equal(hidden[0].index, 0);
  assert.equal(hidden[0].mission, undefined);
  const current = groupHistory([
    { type: 'mission', index: 1 },
    { type: 'vote', index: 0 },
  ]);
  assert.equal(current[1].index, 2);
  assert.equal(current[1].mission, undefined);
  const afterHiddenVote = groupHistory([{ type: 'mission', index: 0 }, { type: 'hidden' }, { type: 'vote', index: 1 }]);
  assert.equal(afterHiddenVote[1].index, 1);
});

function component(name) {
  const { descriptor } = parse(
    fs.readFileSync(require.resolve(`../src/components/view/information/history/${name}.vue`), 'utf8'),
  );
  const module = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(descriptor.script.content, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )((id) => (id === './MissionTeam.vue' ? { default: component('MissionTeam') } : require(id)), module, module.exports);
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: `${name}.vue`,
    id: name,
    compilerOptions: { expressionPlugins: ['typescript'] },
  });
  assert.deepEqual(template.errors, []);
  const compiled = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(template.code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(require, compiled, compiled.exports);
  module.exports.default.render = compiled.exports.render;
  return module.exports.default;
}

async function render(name, data, locale = 'ru', props = {}) {
  const app = Vue.createSSRApp(component(name), { data, playerNames: { a: 'Alice', b: 'Bob' }, ...props });
  app.use(
    createI18n({
      legacy: false,
      locale,
      messages: { [locale]: require(`../src/i18n/langs/${locale}/history.ts`).default },
    }),
  );
  return renderToString(app);
}
const vote = {
  type: 'vote',
  index: 0,
  result: 'reject',
  leaderID: 'a',
  team: [{ id: 'a' }],
  anonymous: false,
  forced: false,
  votes: [
    { playerID: 'a', value: 'approve' },
    { playerID: 'b', value: 'reject' },
  ],
};

test('vote shows an explicit outcome and totals, with names in closed details', async () => {
  const html = await render('Vote', vote);
  assert.match(html, /Отклонена/);
  assert.match(html, /class="attempt-result[^>]*>.*Отклонена.*За:.*1.*Против:.*1.*<\/span>/s);
  assert.match(html, /За:.*1.*Против:.*1/s);
  assert.match(html, /<details[^>]*>.*<summary[^>]*>.*Голоса игроков.*Bob/s);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
});

test('expanded votes separate supporters and opponents into player chips', async () => {
  const html = await render('Vote', vote);
  const details = html.slice(html.indexOf('<details'));
  assert.match(details, /За:.*1.*<ul[^>]*>.*<li[^>]*>Alice<\/li>/s);
  assert.match(details, /Против:.*1.*<ul[^>]*>.*<li[^>]*>Bob<\/li>/s);
});

test('attempt presents distinct team members and labels a leader outside the team', async () => {
  const html = await render('Vote', { ...vote, team: [{ id: 'b', excalibur: true }] });
  assert.match(html, /Попытка 1/);
  assert.match(html, /class="team-chip[^\"]*"[^>]*>.*Bob.*Экскалибур/s);
  assert.match(html, /Лидер.*Alice/s);
  assert.doesNotMatch(html, /команда собрана/);
});

test('compact mission styles participants with supplied cards without a separate disclosure', async () => {
  const html = await render(
    'Mission',
    {
      index: 3,
      result: 'fail',
      fails: 1,
      actions: [{ playerID: 'a', value: 'fail' }, { playerID: 'b' }],
    },
    'ru',
    { compact: true },
  );
  assert.doesNotMatch(html, /Поход провален|4 поход/);
  assert.match(html, /class="team-chip team-chip--fail"[^>]*>.*Alice.*Провал/s);
  assert.match(html, /class="team-chip"[^>]*>.*Bob/s);
  assert.doesNotMatch(html, /<details|Карты похода/);
});

test('cards belong only to the final sent team, including forced teams and revoked earlier approvals', () => {
  const { groupHistory } = require('../src/helpers/history-groups.ts');
  const first = { ...vote, result: 'approve' };
  const rejected = { ...vote, index: 1 };
  const sent = { ...vote, forced: true, index: 2, result: 'approve' };
  const mission = { type: 'mission', index: 0, result: 'fail', fails: 1, actions: [{ playerID: 'a', value: 'fail' }] };
  const groups = groupHistory([first, { type: 'kingReturns' }, rejected, sent, mission]);
  assert.equal(groups[0].missionVote, sent);
  assert.equal(groupHistory([{ type: 'hidden' }, mission])[0].missionVote, undefined);
  assert.equal(groupHistory([first, { type: 'hidden' }, mission])[0].missionVote, undefined);
});

test('sent team shows known success and failure cards while hidden cards stay neutral', async () => {
  const html = await render('Vote', { ...vote, result: 'approve', team: [{ id: 'a' }, { id: 'b' }] }, 'ru', {
    mission: { actions: [{ playerID: 'a', value: 'success' }, { playerID: 'b' }] },
  });
  assert.match(html, /class="team-chip team-chip--success"[^>]*>.*Alice.*Успех/s);
  assert.match(html, /class="team-chip"[^>]*>.*Bob/s);
  assert.doesNotMatch(html, /team-chip--fail|Карты похода/);
});

async function renderGroupedHistory(events, gameEnded = false) {
  const { groupHistory } = require('../src/helpers/history-groups.ts');
  const { descriptor } = parse(
    fs.readFileSync(require.resolve('../src/components/view/information/History.vue'), 'utf8'),
  );
  const app = Vue.createSSRApp({
    render: Vue.compile(descriptor.template.content),
    components: {
      Mission: component('Mission'),
      Vote: component('Vote'),
      VoteTable: { template: '<div />' },
      Assassinate: { template: '<div />' },
    },
    setup: () => ({
      overlay: true,
      gameEnded,
      view: 'list',
      historyGroups: groupHistory(events),
      playerNames: { a: 'Alice', b: 'Bob' },
      closeHistory: () => {},
      toKebabCase: (value) => value,
    }),
  });
  app.component('v-btn', { template: '<button><slot /></button>' });
  app.component('v-overlay', { template: '<div><slot /></div>' });
  app.use(
    createI18n({
      legacy: false,
      locale: 'ru',
      missingWarn: false,
      messages: {
        ru: { ...require('../src/i18n/langs/ru/history.ts').default, infoMessage: { close: 'Закрыть' } },
      },
    }),
  );
  return renderToString(app);
}

test('ended game without assassination leaves the last mission collapsed', async () => {
  const events = [{ type: 'mission', index: 2, result: 'fail', fails: 1 }];
  const ended = await renderGroupedHistory(events, true);
  assert.doesNotMatch(ended, /<details class="history-group" open/);
  const live = await renderGroupedHistory(events);
  assert.match(live, /<details class="history-group" open/);
});

test('ended game expands only the finale', async () => {
  const html = await renderGroupedHistory(
    [{ type: 'mission', index: 2, result: 'success', fails: 0 }, { type: 'assassinate' }],
    true,
  );
  const openGroups = html
    .split('<details class="history-group"')
    .slice(1)
    .filter((group) => group.startsWith(' open'));
  assert.equal(openGroups.length, 1);
  assert.match(openGroups[0].split('</summary>')[0], /Финал/);
});

test('hidden votes do not remove the visible mission roster for spectators', async () => {
  const html = await renderGroupedHistory([
    { type: 'hidden' },
    { type: 'mission', index: 0, result: 'success', fails: 0, actions: [{ playerID: 'a' }, { playerID: 'b' }] },
  ]);
  assert.match(html, /Alice/);
  assert.match(html, /Bob/);
});

test('grouped history decorates only the sent attempt and removes the separate mission row', async () => {
  const html = await renderGroupedHistory([
    vote,
    { ...vote, index: 1, result: 'approve' },
    { type: 'mission', index: 0, result: 'fail', fails: 1, actions: [{ playerID: 'a', value: 'fail' }] },
  ]);
  assert.equal((html.match(/team-chip--fail/g) || []).length, 1);
  assert.doesNotMatch(html, /Карты похода|class="mission"/);
});

test('anonymous and forced votes never offer nonexistent individual votes', async () => {
  const anonymous = await render('Vote', { ...vote, anonymous: true, votes: { approve: 3, reject: 4 } });
  assert.match(anonymous, /Голоса анонимны/);
  assert.doesNotMatch(anonymous, /<details/);
  assert.match(anonymous, /За:.*3.*Против:.*4/s);
  const forced = await render('Vote', { ...vote, forced: true, result: 'approve', votes: [] });
  assert.match(forced, /Принудительное голосование/);
  assert.doesNotMatch(forced, /<details|За:|Против:/);
});

test('preliminary voting also keeps names in closed details with visible totals', async () => {
  const html = await render('PreVote', { type: 'preVote', votes: vote.votes });
  assert.match(html, /За:.*1.*Против:.*1/s);
  assert.match(html, /<details[^>]*>.*<summary[^>]*>.*Голоса игроков.*Bob/s);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
});

test('mission outcomes distinguish success, failure and a hidden result in every locale', async () => {
  for (const locale of ['ru', 'en', 'es', 'pt', 'vi', 'zh_CN', 'zh_TW']) {
    const messages = require(`../src/i18n/langs/${locale}/history.ts`).default;
    assert.ok(
      messages.mission.succeeded && messages.mission.failed && messages.vote.approved && messages.vote.rejected,
    );
    const success = await render('Mission', { index: 0, result: 'success', fails: 0 }, locale);
    const failed = await render('Mission', { index: 1, result: 'fail', fails: 1 }, locale);
    const hidden = await render('Mission', { index: 2, hidden: true }, locale);
    assert.ok(success.includes(messages.mission.succeeded));
    assert.ok(failed.includes(messages.mission.failed));
    assert.ok(hidden.includes(messages.mission.hidden));
    assert.ok(!hidden.includes(messages.mission.succeeded) && !hidden.includes(messages.mission.failed));
  }
});
