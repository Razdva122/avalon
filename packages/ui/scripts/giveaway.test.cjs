const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { editableDraft } = require('../src/pages/community/board-helpers.ts');
const { h } = vue;
const link = {
  props: ['to'],
  setup:
    (props, { slots }) =>
    () =>
      h('a', { href: `${props.to.name}/${props.to.params?.uuid || ''}${props.to.hash || ''}` }, slots.default?.()),
};
function component(relative, inline = false, dependencies = {}) {
  const filename = path.resolve(__dirname, '../src', relative);
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: filename, inlineTemplate: inline });
  const code = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const load = (id) => {
    if (id in dependencies) return dependencies[id];
    if (id === 'vue') return { ...vue, onMounted() {}, onBeforeUnmount() {} };
    if (id === 'vue-i18n')
      return {
        useI18n: () => ({ t: (key, args = {}) => key + (args.date ? ` ${args.date}` : ''), locale: vue.ref('en') }),
      };
    if (id.includes('LocaleLink') || id === '@/components/feedback') return { default: link, LocaleLink: link };
    if (id.startsWith('@avalon/types/')) return require(`../../types/${id.split('/').at(-1)}.ts`);
    if (id === './board-helpers' || id === './board-display')
      return require(`../src/pages/community/${id.slice(2)}.ts`);
    return { default: { render: () => null } };
  };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports.default;
}
function setup(relative, props, dependencies) {
  const emitted = [];
  const state = component(relative, false, dependencies).setup(props, {
    expose() {},
    emit: (...args) => emitted.push(args),
  });
  return { state, emitted };
}
const draft = {
  kind: 'group',
  groupName: 'Team',
  languages: ['en'],
  contacts: [{ type: 'discord', value: 'player' }],
  days: [],
  startHour: 0,
  endHour: 0,
  timeZone: '',
  communication: 'either',
  experience: 'beginner',
  beginnerFriendly: true,
  canTeach: false,
  groupSize: 2,
};
const member = { userID: 'one', name: 'Player One', avatar: 'merlin' };
const draw = {
  nextDrawAt: '2026-10-18T15:00:00Z',
  timeZone: 'Asia/Yekaterinburg',
  latestDraw: {
    drawAt: '2026-10-11T15:00:00Z',
    solo: member,
    group: { userID: 'two', name: 'Player Two', avatar: 'morgana', groupName: 'Team' },
  },
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const delay = () => new Promise((resolve) => setTimeout(resolve, 350));
test('editing preserves independent member IDs but strips public member metadata, normalizing old drafts', () => {
  assert.deepEqual(editableDraft(draft).memberIDs, []);
  const original = { ...draft, memberIDs: ['one', 'deleted'], members: [member] };
  const edited = editableDraft(original);
  assert.deepEqual(edited.memberIDs, ['one', 'deleted']);
  assert.equal('members' in edited, false);
  edited.memberIDs.pop();
  assert.deepEqual(original.memberIDs, ['one', 'deleted']);
});
test('group submission retains members and rejects duplicate IDs or a roster larger than group size', () => {
  const { state, emitted } = setup('pages/community/BoardForm.vue', {
    kind: 'group',
    busy: false,
    initial: { ...draft, memberIDs: ['one'] },
  });
  state.submit();
  assert.deepEqual(emitted[0][1].memberIDs, ['one']);
  state.draft.memberIDs = ['one', 'one'];
  state.submit();
  assert.equal(emitted.length, 1);
  state.draft.memberIDs = ['one', 'two', 'three'];
  state.submit();
  assert.equal(emitted.length, 1);
});
test('solo submission strips any roster', () => {
  const { state, emitted } = setup('pages/community/BoardForm.vue', {
    kind: 'solo',
    busy: false,
    initial: { ...draft, kind: 'solo', groupSize: 1, memberIDs: ['one'] },
  });
  state.submit();
  assert.deepEqual(emitted[0][1].memberIDs, []);
});
test('picker adds unique IDs, enforces capacity, and removes selected IDs', () => {
  const props = vue.reactive({ modelValue: [], members: [], limit: 1 });
  const { state, emitted } = setup('pages/community/MemberPicker.vue', props);
  state.add(member);
  assert.deepEqual(emitted[0], ['update:modelValue', ['one']]);
  props.modelValue = ['one'];
  state.add(member);
  state.add({ ...member, userID: 'two' });
  assert.equal(emitted.length, 1);
  state.remove('one');
  assert.deepEqual(emitted[1], ['update:modelValue', []]);
});
test('picker debounces name search, discards stale responses, and reports failure', async () => {
  const first = deferred(),
    second = deferred();
  let calls = 0;
  const unmount = [];
  const { state } = setup('pages/community/MemberPicker.vue', vue.reactive({ modelValue: [], members: [], limit: 2 }), {
    vue: { ...vue, onBeforeUnmount: (fn) => unmount.push(fn) },
    '@/api/player-boards': { boardRequest: () => (++calls === 1 ? first.promise : second.promise) },
  });
  state.query.value = 'A';
  await delay();
  assert.equal(calls, 0);
  state.query.value = 'Al';
  state.query.value = 'Ali';
  await delay();
  assert.equal(calls, 1);
  state.query.value = 'Bo';
  await delay();
  assert.equal(calls, 2);
  second.resolve({ members: [{ ...member, userID: 'two' }] });
  await delay();
  first.resolve({ members: [member] });
  await delay();
  assert.equal(state.results.value[0].userID, 'two');
  state.query.value = 'Bad';
  await delay();
  await delay();
  // Subsequent requests use the settled second promise; test failure separately below.
  unmount.forEach((fn) => fn());
  const failure = setup(
    'pages/community/MemberPicker.vue',
    { modelValue: [], members: [], limit: 2 },
    {
      '@/api/player-boards': {
        boardRequest: async () => {
          throw new Error('offline');
        },
      },
    },
  );
  failure.state.query.value = 'Bad';
  await delay();
  assert.equal(failure.state.status.value, 'error');
});
test('picker renders selected names, removable missing accounts, capacity feedback and public links', async () => {
  const html = await renderToString(
    vue.createSSRApp(component('pages/community/MemberPicker.vue', true), {
      modelValue: ['one', 'deleted'],
      members: [member],
      limit: 2,
    }),
  );
  assert.match(html, /Player One/);
  assert.match(html, /giveaway\.missingMember/);
  assert.match(html, /user_stats\/one/);
  assert.match(html, /giveaway\.removeMember/);
  assert.match(html, /giveaway\.membersFull/);
  assert.match(html, /disabled/);
});
test('group cards render linked members and old listings render safely', async () => {
  const listing = {
    ...draft,
    active: true,
    moderated: false,
    expiresAt: '2026-11-01T00:00:00Z',
    bumpedAt: '2026-10-06T00:00:00Z',
    members: [member],
  };
  const card = component('pages/community/BoardCard.vue', true);
  const html = await renderToString(vue.createSSRApp(card, { listing, now: Date.now() }));
  assert.match(html, /Player One/);
  assert.match(html, /user_stats\/one/);
  await renderToString(vue.createSSRApp(card, { listing: { ...listing, members: undefined }, now: Date.now() }));
});
test('giveaway renders truthful loading, dated results, empty categories and recoverable failure', async () => {
  let request = deferred();
  const render = component('pages/support/Giveaway.vue', true, {
    '@/api/support': { giveawayRequest: () => request.promise },
  }).setup({}, { expose() {} });
  const html = () => renderToString(vue.createSSRApp({ render: () => render({}, []) }));
  assert.match(await html(), /giveaway\.loading/);
  // Use non-template compilation to drive the same component state.
  const { state } = setup('pages/support/Giveaway.vue', {}, { '@/api/support': { giveawayRequest: async () => draw } });
  await state.load();
  assert.equal(state.data.value.latestDraw.group.groupName, 'Team');
  const mounted = [];
  const resultsRender = component('pages/support/Giveaway.vue', true, {
    vue: { ...vue, onMounted: (fn) => mounted.push(fn), onBeforeUnmount() {} },
    '@/api/support': { giveawayRequest: async () => draw },
  }).setup({}, { expose() {} });
  await mounted[0]();
  const resultHtml = () => renderToString(vue.createSSRApp({ render: () => resultsRender({}, []) }));
  const results = await resultHtml();
  assert.match(results, /Player One/);
  assert.match(results, /Player Two/);
  assert.match(results, /Team/);
  assert.match(results, /user_stats\/one/);
  assert.match(results, /giveaway\.latestDraw/);
  assert.match(results, /2026/);
  assert.match(results, /community_solo/);
  assert.match(results, /community_group/);
  const emptyMounted = [];
  const emptyRender = component('pages/support/Giveaway.vue', true, {
    vue: { ...vue, onMounted: (fn) => emptyMounted.push(fn), onBeforeUnmount() {} },
    '@/api/support': {
      giveawayRequest: async () => ({ ...draw, latestDraw: { ...draw.latestDraw, solo: null, group: null } }),
    },
  }).setup({}, { expose() {} });
  await emptyMounted[0]();
  assert.equal(
    (await renderToString(vue.createSSRApp({ render: () => emptyRender({}, []) }))).match(/giveaway\.noWinner/g).length,
    2,
  );
  const errorMounted = [];
  const errorRender = component('pages/support/Giveaway.vue', true, {
    vue: { ...vue, onMounted: (fn) => errorMounted.push(fn), onBeforeUnmount() {} },
    '@/api/support': {
      giveawayRequest: async () => {
        throw new Error('offline');
      },
    },
  }).setup({}, { expose() {} });
  await errorMounted[0]();
  const failure = await renderToString(vue.createSSRApp({ render: () => errorRender({}, []) }));
  assert.match(failure, /role="alert"/);
  assert.match(failure, /giveaway\.retry/);
});
test('giveaway discards stale retry and unmounted responses', async () => {
  const first = deferred(),
    second = deferred();
  let count = 0;
  const unmount = [];
  const { state } = setup(
    'pages/support/Giveaway.vue',
    {},
    {
      vue: { ...vue, onMounted() {}, onBeforeUnmount: (fn) => unmount.push(fn) },
      '@/api/support': { giveawayRequest: () => (++count === 1 ? first.promise : second.promise) },
    },
  );
  const a = state.load(),
    b = state.load();
  second.resolve(draw);
  await b;
  first.resolve({ ...draw, latestDraw: null });
  await a;
  assert.ok(state.data.value.latestDraw);
  const pending = deferred();
  const final = setup(
    'pages/support/Giveaway.vue',
    {},
    {
      vue: { ...vue, onMounted() {}, onBeforeUnmount: (fn) => unmount.push(fn) },
      '@/api/support': { giveawayRequest: () => pending.promise },
    },
  );
  const c = final.state.load();
  unmount.forEach((fn) => fn());
  pending.resolve(draw);
  await c;
  assert.equal(final.state.data.value, null);
});
