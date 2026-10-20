const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');

function fixture() {
  const source = fs.readFileSync(path.join(__dirname, '../src/helpers/composables/useBotDashboard.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const store = { state: vue.reactive({ profile: { id: 'admin', token: 'one' } }) };
  const requests = [];
  const listeners = {};
  const cleanup = [];
  const socket = {
    timeout: () => ({ emitWithAck: () => new Promise((resolve, reject) => requests.push({ resolve, reject })) }),
    on: (event, fn) => {
      listeners[event] = fn;
    },
    off: () => {},
  };
  const exports = {};
  const requireMock = (id) =>
    id === 'vue'
      ? { ...vue, onBeforeUnmount: (fn) => cleanup.push(fn) }
      : id === '@/store'
        ? { useStore: () => store }
        : { socket };
  new Function('require', 'exports', 'setInterval', 'clearInterval', 'document', js)(
    requireMock,
    exports,
    () => 1,
    () => {},
    { hidden: false },
  );
  const dashboard = exports.useBotDashboard();
  return { store, requests, listeners, dashboard, stop: () => cleanup.forEach((fn) => fn()) };
}
const snapshot = { checkedAt: 123, instances: [{ id: 'one', status: 'free' }] };
const tick = async () => {
  await vue.nextTick();
  await Promise.resolve();
};

test('logout discards an in-flight admin response', async () => {
  const f = fixture();
  f.store.state.profile = null;
  await tick();
  f.requests[0].resolve(snapshot);
  await tick();
  assert.equal(f.dashboard.data.value, null);
  assert.equal(f.dashboard.denied.value, true);
  f.stop();
});

test('refresh failures preserve the timestamped snapshot, but server denial clears it', async () => {
  const f = fixture();
  f.requests[0].resolve(snapshot);
  await tick();
  const refresh = f.dashboard.refresh();
  f.requests[1].reject(Error('offline'));
  await refresh;
  assert.equal(f.dashboard.data.value.checkedAt, 123);
  assert.equal(f.dashboard.error.value, true);
  const retry = f.dashboard.refresh();
  f.requests[2].resolve({ error: 'AI room access denied' });
  await retry;
  assert.equal(f.dashboard.data.value, null);
  assert.equal(f.dashboard.denied.value, true);
  f.stop();
});

test('a disconnected or replaced session cannot republish private data', async () => {
  const f = fixture();
  f.listeners.disconnect();
  f.requests[0].resolve(snapshot);
  await tick();
  assert.equal(f.dashboard.data.value, null);
  f.store.state.profile = { id: 'other', token: 'two' };
  await tick();
  f.requests[1].resolve({ error: 'AI room access denied' });
  await tick();
  assert.equal(f.dashboard.denied.value, true);
  f.stop();
});

test('saving thresholds only changes the displayed policy after a successful acknowledgement', async () => {
  const f = fixture();
  f.requests[0].resolve({ ...snapshot, thresholds: { regular: { weekly: 3, shortTerm: 30 } } });
  await tick();
  const thresholds = { regular: { weekly: 7, shortTerm: 40 } };
  const first = f.dashboard.saveThresholds(thresholds);
  f.requests[1].resolve({ error: 'requestFailed' });
  assert.equal(await first, false);
  assert.equal(f.dashboard.data.value.thresholds.regular.weekly, 3);
  assert.equal(f.dashboard.saveError.value, true);
  const retry = f.dashboard.saveThresholds(thresholds);
  f.requests[2].resolve({ ok: true });
  assert.equal(await retry, true);
  assert.equal(f.dashboard.data.value.thresholds.regular.weekly, 7);
  assert.equal(f.dashboard.saveError.value, false);
  f.stop();
});

test('a late save acknowledgement cannot restore a logged out session', async () => {
  const f = fixture();
  f.requests[0].resolve(snapshot);
  await tick();
  const save = f.dashboard.saveThresholds({});
  f.store.state.profile = null;
  await tick();
  f.requests[1].resolve({ ok: true });
  assert.equal(await save, false);
  assert.equal(f.dashboard.data.value, null);
  f.stop();
});

function settingsForm(initialDraft = null) {
  const { parse, compileScript } = require('@vue/compiler-sfc');
  const filename = path.join(__dirname, '../src/pages/admin/BotQuotaSettings.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: filename }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  const props = vue.reactive({
    initialDraft,
    thresholds: {
      smart: { weekly: 5, shortTerm: 60 },
      regular: { weekly: 3, shortTerm: 30 },
      beginner: { weekly: 1, shortTerm: 20 },
    },
    saving: false,
    loading: false,
    error: false,
    saved: false,
  });
  const emitted = [];
  const form = module.exports.default.setup(props, { expose() {}, emit: (...args) => emitted.push(args) });
  return { props, form, emitted };
}

test('threshold polling preserves unsaved edits; discarding adopts the latest server values', async () => {
  const { props, form } = settingsForm();
  form.draft.value.smart.weekly = 9;
  props.thresholds = { ...props.thresholds, smart: { weekly: 7, shortTerm: 65 } };
  await tick();
  assert.equal(form.draft.value.smart.weekly, 9);
  form.reset();
  assert.equal(form.draft.value.smart.weekly, 7);
  assert.equal(form.dirty.value, false);
  props.thresholds = { ...props.thresholds, smart: { weekly: 8, shortTerm: 65 } };
  await tick();
  assert.equal(form.draft.value.smart.weekly, 8);
});

test('the reauthorized form restores a same-session draft without mutating the saved policy', () => {
  const initialDraft = {
    smart: { weekly: 9, shortTerm: 65 },
    regular: { weekly: 3, shortTerm: 30 },
    beginner: { weekly: 1, shortTerm: 20 },
  };
  const { props, form } = settingsForm(initialDraft);
  assert.equal(form.draft.value.smart.weekly, 9);
  assert.equal(props.thresholds.smart.weekly, 5);
  assert.equal(form.dirty.value, true);
  form.reset();
  assert.equal(form.draft.value.smart.weekly, 5);
});

test('threshold form prevents invalid percentages and duplicate saves', () => {
  const { props, form, emitted } = settingsForm();
  for (const value of [-1, 101, 2.5, '', NaN]) {
    form.draft.value.regular.weekly = value;
    form.submit();
  }
  assert.equal(emitted.filter(([event]) => event === 'save').length, 0);
  form.draft.value.regular.weekly = 7;
  props.saving = true;
  form.submit();
  assert.equal(emitted.filter(([event]) => event === 'save').length, 0);
  props.saving = false;
  form.submit();
  assert.equal(emitted.find(([event]) => event === 'save')[1].regular.weekly, 7);
});

test('a temporary disconnect preserves only the same-session form draft, and denial or logout removes it', async () => {
  const f = fixture();
  f.requests[0].resolve(snapshot);
  await tick();
  const draft = { smart: { weekly: 9, shortTerm: 65 } };
  f.dashboard.draftThresholds.value = draft;
  f.listeners.disconnect();
  assert.equal(f.dashboard.data.value, null);
  assert.equal(f.dashboard.draftThresholds.value.smart.weekly, 9);
  const reconnect = f.dashboard.refresh();
  f.requests[1].resolve({ error: 'AI room access denied' });
  await reconnect;
  assert.equal(f.dashboard.draftThresholds.value, null);
  f.dashboard.draftThresholds.value = draft;
  f.store.state.profile = null;
  await tick();
  assert.equal(f.dashboard.draftThresholds.value, null);
  f.stop();
});

test('quota fields identify their mode and explain invalid percentages', async () => {
  const { parse, compileScript } = require('@vue/compiler-sfc');
  const { renderToString } = require('@vue/server-renderer');
  const filename = path.join(__dirname, '../src/pages/admin/BotQuotaSettings.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: filename, inlineTemplate: true }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  const app = vue.createSSRApp(module.exports.default, {
    thresholds: {
      smart: { weekly: 5, shortTerm: 101 },
      regular: { weekly: 3, shortTerm: 30 },
      beginner: { weekly: 1, shortTerm: 20 },
    },
    saving: false,
    loading: false,
    error: false,
    saved: false,
  });
  app.config.globalProperties.$t = (key) => key;
  app.component('v-btn', { template: '<button><slot /></button>' });
  const html = await renderToString(app);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aiArena.thresholdRangeError/);
  for (const mode of ['smart', 'regular', 'beginner']) {
    assert.match(html, new RegExp('aria-label="[^"]*dashboardMode' + mode));
  }
});
