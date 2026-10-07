const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { renderToString } = require('@vue/server-renderer');
const { parse, compileScript } = require('@vue/compiler-sfc');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
function component(name, inlineTemplate = false) {
  const file = path.resolve(__dirname, `../src/pages/community/${name}.vue`);
  const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file });
  const script = compileScript(descriptor, { id: file, inlineTemplate });
  const code = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const load = (id) => {
    if (id === 'vue') return vue;
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key, locale: vue.ref('ru') }) };
    if (id.startsWith('@avalon/types/')) return require(`../../types/${id.split('/').at(-1)}.ts`);
    if (
      id === './board-helpers' ||
      id === './board-display' ||
      id === './board-schedule' ||
      id === './board-form-session'
    )
      return require(`../src/pages/community/${id.slice(2)}.ts`);
    return { default: { render: () => null } };
  };
  new Function('require', 'module', 'exports', code)(load, module, module.exports);
  return module.exports.default;
}

test('contact actions distinguish invitations, usernames and numeric IDs', async () => {
  const card = {
    ...listing('group'),
    contacts: [
      { type: 'discord', value: 'https://discord.gg/avalon' },
      { type: 'telegram', value: '@avalon_player' },
      { type: 'qqGroup', value: '123456' },
    ],
  };
  const html = await renderToString(vue.createSSRApp(component('BoardCard', true), { listing: card, now }));
  assert.match(html, /playerBoards.joinTeam/);
  assert.match(html, /playerBoards.copyUsername/);
  assert.match(html, /playerBoards.copyLink/);
  assert.match(html, />playerBoards.copy<\/button>/);
  assert.doesNotMatch(html, /playerBoards.openInvite/);
});

test('successful username copy exposes platform next step and failed copy clears it', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const writes = [];
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (value) => {
          writes.push(value);
        },
      },
    },
  });
  try {
    const card = component('BoardCard').setup(
      {
        listing: {
          ...listing('solo'),
          contacts: [
            { type: 'discord', value: 'avalon_player' },
            { type: 'telegram', value: '@avalon_player' },
            { type: 'qq', value: '123456' },
          ],
        },
        now,
      },
      { expose() {} },
    );
    assert.equal(card.copyNextStep.value, '');
    await card.copy('avalon_player', 0);
    assert.equal(card.copyNextStep.value, 'playerBoards.copyNext_discord');
    await card.copy('@avalon_player', 1);
    assert.equal(card.copyNextStep.value, 'playerBoards.copyNext_telegram');
    await card.copy('123456', 2);
    assert.equal(card.copyNextStep.value, '');
    assert.deepEqual(writes, ['avalon_player', '@avalon_player', '123456']);
    await card.copy('avalon_player', 0);
    navigator.clipboard.writeText = async () => {
      throw new Error('Permission denied');
    };
    await card.copy('@avalon_player', 1);
    assert.equal(card.copyFailed.value, true);
    assert.equal(card.copyNextStep.value, '');
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete globalThis.navigator;
  }
});

test('schedule displays visitor time, a reference week, and original details', async () => {
  const scheduled = {
    ...listing('solo'),
    scheduleEnabled: true,
    days: [1],
    startHour: 18,
    endHour: 20,
    timeZone: 'UTC',
  };
  const html = await renderToString(vue.createSSRApp(component('BoardCard', true), { listing: scheduled, now }));
  assert.match(html, /playerBoards.yourTime/);
  assert.match(html, /playerBoards.scheduleReference/);
  assert.match(html, /<details[^>]*>[\s\S]*<summary>playerBoards.originalSchedule<\/summary>/);
  const flexible = await renderToString(
    vue.createSSRApp(component('BoardCard', true), { listing: listing('solo'), now }),
  );
  assert.match(flexible, /playerBoards.timeByAgreement/);
});
const now = Date.parse('2026-09-29T12:00:00Z');
const listing = (kind) => ({
  id: 'test',
  kind,
  name: 'Test',
  groupName: kind === 'group' ? 'Test group' : '',
  active: false,
  moderated: false,
  languages: ['ru'],
  days: [],
  startHour: 0,
  endHour: 0,
  timeZone: '',
  communication: 'either',
  experience: 'experienced',
  beginnerFriendly: false,
  canTeach: true,
  groupSize: kind === 'group' ? 4 : 1,
  contacts: [
    { type: 'discord', value: '123124' },
    { type: 'wechat', value: '201212' },
  ],
  bumpedAt: new Date(now).toISOString(),
  expiresAt: new Date(now + 30 * 86400000).toISOString(),
});
for (const kind of ['solo', 'group']) {
  test(`${kind}: editing saved optional fields emits a complete draft without metadata`, () => {
    const emitted = [];
    const form = component('BoardForm').setup(
      { kind, initial: listing(kind), busy: false },
      {
        expose() {},
        emit: (...args) => emitted.push(args),
      },
    );
    form.submit();
    assert.equal(form.invalid.value, false);
    assert.equal(emitted[0][0], 'save');
    const draft = emitted[0][1];
    assert.equal(draft.otherLanguage, '');
    assert.equal(draft.scheduleEnabled, false);
    assert.equal('id' in draft, false);
    assert.equal('active' in draft, false);
    assert.deepEqual(draft.contacts, listing(kind).contacts);
  });
  test(`${kind}: hidden listing shows an enabled activation button during bump cooldown`, async () => {
    const html = await renderToString(
      vue.createSSRApp(component('BoardCard', true), { listing: listing(kind), owner: true, now }),
    );
    assert.match(html, /<button[^>]*class="activate-button"[^>]*>playerBoards.reactivate<\/button>/);
    const activation = html.match(/<button[^>]*class="activate-button"[^>]*>/)[0];
    assert.doesNotMatch(activation, /disabled/);
    assert.doesNotMatch(html, /playerBoards.bumpAvailable/);
  });
}

test('typing persists the actual form draft, reopening restores it and discard resets to saved listing', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const items = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: (key) => items.delete(key),
    },
  });
  const scope = vue.effectScope();
  try {
    const props = { kind: 'solo', initial: listing('solo'), busy: false, draftKey: 'alice:solo:test' };
    const setup = () => scope.run(() => component('BoardForm').setup(props, { expose() {}, emit() {} }));
    const form = setup();
    form.draft.contacts[0].value = 'new_username';
    form.draft.scheduleEnabled = true;
    form.draft.days = [2];
    const reopened = setup();
    assert.equal(reopened.draft.contacts[0].value, 'new_username');
    assert.deepEqual([...reopened.draft.days], [2]);
    assert.equal(reopened.draftSaved.value, true);
    reopened.discardDraft();
    assert.equal(reopened.draft.contacts[0].value, '123124');
    assert.equal(reopened.draftSaved.value, false);
    assert.equal(items.size, 0);
  } finally {
    scope.stop();
    if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous);
    else delete globalThis.sessionStorage;
  }
});

test('contacts are added only after an explicit platform choice', async () => {
  const emitted = [];
  const form = component('BoardForm').setup(
    { kind: 'solo', busy: false },
    { expose() {}, emit: (...args) => emitted.push(args) },
  );
  assert.deepEqual([...form.draft.contacts], []);
  form.draft.languages = ['ru'];
  form.submit();
  assert.equal(form.invalid.value, true);
  assert.equal(emitted.length, 0);
  form.addContact();
  assert.equal(form.draft.contacts.length, 0);
  form.addContact('telegram');
  assert.deepEqual([...form.draft.contacts], [{ type: 'telegram', value: '' }]);
  form.addContact('telegram');
  form.addContact('qqGroup');
  assert.equal(form.draft.contacts.length, 1);
  form.addContact('discord');
  form.addContact('qq');
  assert.equal(form.draft.contacts.length, 2);
  const html = await renderToString(vue.createSSRApp(component('BoardForm', true), { kind: 'solo', busy: false }));
  assert.match(html, /playerBoards.chooseContactPlatform/);
  assert.match(html, /class="contact-platforms"/);
  assert.doesNotMatch(html, /contact-help-0/);
});
