const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { copyOptions, setRoleCount, roleRequirement } = require('../src/components/view/options/options-state.ts');

test('editing a draft never changes the room, including nested timer settings', () => {
  const room = { roles: { merlin: 1, percival: 1 }, features: { timerDurations: { onMission: { duration: 60 } } } };
  const draft = copyOptions(room);
  setRoleCount(draft.roles, 'merlin', 0);
  draft.features.timerDurations.onMission.duration = 120;
  assert.deepEqual(room, {
    roles: { merlin: 1, percival: 1 },
    features: { timerDurations: { onMission: { duration: 60 } } },
  });
});

test('removing the last Merlin removes dependent roles but preserves unrelated choices', () => {
  const roles = { merlin: 2, percival: 1, morgana: 1, mordred: 1, oberon: 1 };
  setRoleCount(roles, 'merlin', 1);
  assert.equal(roles.percival, 1);
  setRoleCount(roles, 'merlin', 0);
  assert.deepEqual(roles, { merlin: 0, percival: 0, morgana: 0, mordred: 0, oberon: 1 });
});

test('paired roles stay synchronized when changed with counters', () => {
  const roles = { tristan: 1, isolde: 1, goodLancelot: 1, evilLancelot: 1, guinevere: 1 };
  setRoleCount(roles, 'isolde', 2);
  assert.equal(roles.tristan, 2);
  setRoleCount(roles, 'goodLancelot', 0);
  assert.equal(roles.evilLancelot, 0);
  assert.equal(roles.guinevere, 0);
});

test('requirements distinguish alternative Merlin, missing Merlin, and missing Percival', () => {
  assert.equal(roleRequirement('merlin', { merlinPure: 1 }), 'alternativeMerlin');
  assert.equal(roleRequirement('percival', {}), 'requiresMerlin');
  assert.equal(roleRequirement('morgana', {}), 'requiresMerlinPercival');
  assert.equal(roleRequirement('morgana', { merlin: 1 }), 'requiresPercival');
  assert.equal(roleRequirement('morgana', { merlinPure: 1, percival: 1 }), undefined);
  assert.equal(roleRequirement('guinevere', {}), 'requiresLancelots');
});

test('unavailable roles cannot be added and role counts cannot become negative', () => {
  const roles = { merlin: 1, oberon: 0 };
  setRoleCount(roles, 'merlinPure', 1);
  setRoleCount(roles, 'oberon', -1);
  assert.equal(roles.merlinPure, undefined);
  assert.equal(roles.oberon, 0);
});

const { reactive, effectScope, nextTick } = require('vue');
const { useRoomOptions } = require('../src/components/view/options/room-options.ts');

test('consecutive changes preserve pending roles across delayed room broadcasts', async () => {
  const room = reactive({ options: { roles: { merlin: 1 }, addons: {}, features: {} } });
  const sent = [];
  const scope = effectScope();
  const editor = scope.run(() =>
    useRoomOptions(
      () => room.options,
      (value) => sent.push(value),
    ),
  );
  try {
    editor.applyOptions({ ...editor.options.value, roles: { merlin: 1, percival: 1 } });
    editor.applyOptions({ ...editor.options.value, features: { useCustomTimer: true } });
    assert.equal(sent[1].roles.percival, 1);
    room.options = sent[0];
    await nextTick();
    assert.equal(editor.options.value.features.useCustomTimer, true);
    room.options = sent[1];
    await nextTick();
    assert.deepEqual(editor.options.value, sent[1]);
    room.options = { roles: { oberon: 1 }, addons: {}, features: {} };
    await nextTick();
    assert.deepEqual(editor.options.value.roles, { oberon: 1 });
  } finally {
    scope.stop();
  }
});

// Exercise the real SFC handlers without mounting presentation-only children.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { parse } = require('@vue/compiler-sfc');
const ts = require('typescript');
const optionsFile = path.resolve(__dirname, '../src/components/view/options/Options.vue');
const componentModule = { exports: {} };
const componentRequire = createRequire(optionsFile);
const script = parse(fs.readFileSync(optionsFile, 'utf8')).descriptor.script.content;
new Function(
  'require',
  'module',
  'exports',
  ts.transpileModule(script, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(
  (name) => {
    if (name.endsWith('.vue')) return {};
    if (name === '@/components/view/information/const') return { rolesShortInfo: {} };
    return componentRequire(name);
  },
  componentModule,
  componentModule.exports,
);
const Options = componentModule.exports.default;

function panel() {
  const emitted = [];
  const instance = {
    roles: { merlin: 1, percival: 1, morgana: 1 },
    addons: {},
    features: {},
    $emit: (event, value) => emitted.push({ event, value }),
    $t: (key) => key,
    ...Options.data(),
  };
  for (const [name, method] of Object.entries(Options.methods)) instance[name] = method.bind(instance);
  for (const [name, getter] of Object.entries(Options.computed))
    Object.defineProperty(instance, name, { get: () => getter.call(instance) });
  instance.openOptions();
  return { instance, emitted };
}

test('role edits publish the full valid composition immediately without closing the panel', () => {
  const { instance, emitted } = panel();
  instance.changeRole('merlin', 0);
  assert.equal(emitted.length, 1);
  assert.deepEqual(emitted[0].value.roles, { merlin: 0, percival: 0, morgana: 0, mordred: 0 });
  assert.equal(instance.overlay, true);
  instance.overlay = false;
  assert.equal(emitted.length, 1);
  instance.undoRoleChange();
  assert.equal(emitted.length, 2);
  assert.deepEqual(emitted[1].value.roles, { merlin: 1, percival: 1, morgana: 1 });
});

test('addon and feature edits publish immediately, preserving mutual exclusion', () => {
  const { instance, emitted } = panel();
  instance.changeAddon('ladyOfLake', true);
  instance.changeAddon('ladyOfSea', true);
  instance.changeFeature('displayIndex', true);
  assert.equal(emitted.length, 3);
  assert.deepEqual(emitted[1].value.addons, { ladyOfLake: false, ladyOfSea: true });
  assert.equal(emitted[2].value.features.displayIndex, true);
  assert.equal(instance.overlay, true);
});

test('opening a dedicated section uses the latest complete settings', () => {
  const { instance, emitted } = panel();
  instance.section = 'addons';
  instance.features = { displayIndex: true, useCustomTimer: true };
  instance.openOptions();
  assert.equal(instance.type, 'addons');
  instance.changeAddon('excalibur', true);
  assert.deepEqual(emitted.at(-1).value.features, { displayIndex: true, useCustomTimer: true });
  assert.deepEqual(emitted.at(-1).value.roles, instance.roles);
  instance.section = 'features';
  instance.addons = { plotCards: true };
  instance.openOptions();
  assert.equal(instance.type, 'features');
  instance.changeFeature('anonymousVoting', true);
  assert.deepEqual(emitted.at(-1).value.addons, { plotCards: true });
  instance.section = 'roles';
  instance.openOptions();
  assert.equal(instance.type, 'roles');
});

test('Trapper and plot cards cannot be enabled together, while Excalibur stays selected', () => {
  const { instance } = panel();
  instance.playerCount = 8;
  instance.changeAddon('excalibur', true);
  instance.changeAddon('plotCards', true);
  instance.changeAddon('trapper', true);
  assert.equal(instance.settings.addons.trapper, true);
  assert.equal(instance.settings.addons.plotCards, false);
  assert.equal(instance.settings.addons.excalibur, true);
  instance.changeAddon('plotCards', true);
  assert.equal(instance.settings.addons.trapper, false);
});

test('Trapper cannot be enabled below eight players', () => {
  const { instance, emitted } = panel();
  instance.playerCount = 7;
  instance.changeAddon('trapper', true);
  assert.notEqual(instance.settings.addons.trapper, true);
  assert.equal(emitted.length, 0);
});

test('addon help uses short Trapper copy, its own rules page and independent Plot Cards help', async () => {
  const Vue = require('vue');
  const { renderToString } = require('@vue/server-renderer');
  const { createI18n } = require('vue-i18n');
  const { trapper } = require('../src/i18n/langs/trapper.ts');
  const words = require('../src/i18n/langs/ru/addons.ts').default;
  const help = [];
  const Help = {
    props: ['label', 'content', 'route', 'hint'],
    setup:
      (props, { slots }) =>
      () => {
        help.push({ ...props });
        return Vue.h('aside', slots.default?.());
      },
  };
  const icon = parse(
    fs.readFileSync(path.resolve(__dirname, '../src/components/view/information/AddonIcon.vue'), 'utf8'),
  ).descriptor;
  const iconModule = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(icon.script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  )(require, iconModule, iconModule.exports);
  const AddonIcon = { ...iconModule.exports.default, render: Vue.compile(icon.template.content) };
  const Subject = {
    ...Options,
    components: { ...Options.components, OptionHelp: Help, AddonIcon, PlayerIcon: { render: () => null } },
    data() {
      return { ...Options.data.call(this), type: 'addons', settings: { roles: {}, addons: {} } };
    },
    render: Vue.compile(parse(fs.readFileSync(optionsFile, 'utf8')).descriptor.template.content),
  };
  const app = Vue.createSSRApp(Subject, { roles: {}, addons: {}, buttonText: 'Дополнения', section: 'addons' });
  app.use(
    createI18n({
      legacy: false,
      locale: 'ru',
      messages: { ru: { ...words, trapper: trapper.ru } },
      missingWarn: false,
      fallbackWarn: false,
    }),
  );
  for (const name of ['v-btn', 'v-dialog', 'v-card', 'v-checkbox', 'v-tabs', 'v-tab']) {
    app.component(name, {
      setup:
        (_, { slots }) =>
        () =>
          Vue.h('div', slots.default?.()),
    });
  }
  const html = await renderToString(app);
  const trapped = help.find((item) => item.label === 'Ловец');
  assert.equal(trapped.route, 'trapper');
  assert.equal(trapped.content, trapper.ru.hint);
  assert.ok(trapped.content.length < 150);
  assert.equal(trapped.hint, trapper.ru.players);
  const plot = help.find((item) => item.label === 'Сюжетные карты');
  assert.equal(plot.content, words.options.plotCardsHint);
  assert.equal(plot.hint, undefined);
  assert.match(html, /class="[^"]*icon-trapper[^"]*"/);
});
