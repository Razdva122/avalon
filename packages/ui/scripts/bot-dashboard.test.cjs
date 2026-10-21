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
    timeout: () => ({
      emitWithAck: (event, payload) =>
        new Promise((resolve, reject) => requests.push({ event, payload, resolve, reject })),
    }),
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

function dashboardPage() {
  const { parse, compileScript } = require('@vue/compiler-sfc');
  const filename = path.join(__dirname, '../src/pages/admin/Bots.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: filename }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const dashboard = {
    data: vue.ref({ ...snapshot }),
    denied: vue.ref(false),
    draftThresholds: vue.ref({ smart: { weekly: 9 } }),
  };
  const module = { exports: {} };
  const mockedRequire = (id) => {
    if (id === 'vue') return vue;
    if (id === './locales') return { useAdminBotMessages: () => ({ locale: vue.ref('ru') }) };
    if (id.includes('useBotDashboard')) return { useBotDashboard: () => dashboard };
    return {};
  };
  new Function('require', 'module', 'exports', code)(mockedRequire, module, module.exports);
  const scope = vue.effectScope();
  const page = scope.run(() => module.exports.default.setup({}, { expose() {} }));
  return { page, dashboard, stop: () => scope.stop() };
}

test('settings start closed, preserve drafts on close, and close when admin data is removed', async () => {
  const { page, dashboard, stop } = dashboardPage();
  try {
    assert.equal(page.settingsOpen?.value, false);
    page.settingsOpen.value = true;
    page.settingsOpen.value = false;
    assert.equal(dashboard.draftThresholds.value.smart.weekly, 9);
    page.settingsOpen.value = true;
    dashboard.data.value = null;
    await vue.nextTick();
    assert.equal(page.settingsOpen.value, false);
    dashboard.data.value = { ...snapshot };
    await vue.nextTick();
    assert.equal(page.settingsOpen.value, false);
    page.settingsOpen.value = true;
    dashboard.denied.value = true;
    await vue.nextTick();
    assert.equal(page.settingsOpen.value, false);
  } finally {
    stop();
  }
});

const resetSnapshot = {
  ...snapshot,
  instances: [
    {
      id: 'one',
      quota: {
        resetCredits: {
          availableCount: 2,
          credits: [
            { id: 'expired', expiresAt: 1 },
            { id: 'later', expiresAt: 9999999999 },
            { id: 'first', expiresAt: 9999999998 },
          ],
        },
      },
    },
  ],
};
test('manual reset only emits after action, prevents duplicates and reuses the key after timeout', async () => {
  const f = fixture();
  f.requests[0].resolve(structuredClone(resetSnapshot));
  await tick();
  assert.equal(f.requests.length, 1);
  const first = f.dashboard.consumeReset('one');
  assert.equal(f.requests[1].event, 'consumeAiBotReset');
  assert.equal(f.requests[1].payload.creditId, 'first');
  assert.ok(f.requests[1].payload.idempotencyKey);
  await f.dashboard.consumeReset('one');
  assert.equal(f.requests.length, 2);
  f.requests[1].reject(Error('timeout'));
  await first;
  const retry = f.dashboard.consumeReset('one');
  assert.deepEqual(f.requests[2].payload, f.requests[1].payload);
  f.requests[2].resolve({ outcome: 'alreadyRedeemed' });
  await retry;
  assert.equal(f.dashboard.resetFeedback.value.one, 'alreadyRedeemed');
  assert.equal(f.dashboard.resetAttempts.value.one, undefined);
  assert.equal(f.requests[3].event, 'getAiBotDashboard');
  f.stop();
});
test('disconnect preserves reset retry key but stale acknowledgement cannot publish; logout removes it', async () => {
  const f = fixture();
  f.requests[0].resolve(structuredClone(resetSnapshot));
  await tick();
  const reset = f.dashboard.consumeReset('one');
  const key = f.requests[1].payload.idempotencyKey;
  f.listeners.disconnect();
  f.requests[1].resolve({ outcome: 'reset' });
  await reset;
  assert.equal(f.dashboard.data.value, null);
  assert.deepEqual({ ...f.dashboard.resetFeedback.value }, {});
  assert.equal(f.dashboard.resetAttempts.value.one.idempotencyKey, key);
  f.store.state.profile = null;
  assert.deepEqual({ ...f.dashboard.resetAttempts.value }, {});
  f.stop();
});
test('reset supports count-only data and terminal no-op outcomes, but refuses unavailable or expired-only credits', async () => {
  const f = fixture();
  f.requests[0].resolve({
    ...snapshot,
    instances: [{ id: 'one', quota: { resetCredits: { availableCount: 1, credits: null } } }],
  });
  await tick();
  const reset = f.dashboard.consumeReset('one');
  assert.equal(f.requests[1].payload.creditId, undefined);
  f.requests[1].resolve({ outcome: 'nothingToReset' });
  await reset;
  assert.equal(f.dashboard.resetFeedback.value.one, 'nothingToReset');
  f.requests[2].resolve(structuredClone(resetSnapshot));
  await tick();
  f.dashboard.data.value.instances[0].quota.resetCredits.credits = [{ id: 'expired', expiresAt: 1 }];
  await f.dashboard.consumeReset('one');
  assert.equal(f.requests.length, 3);
  f.stop();
});

test('unknown reset acknowledgement preserves retry key, and access denial clears private reset state', async () => {
  const f = fixture();
  f.requests[0].resolve(structuredClone(resetSnapshot));
  await tick();
  const reset = f.dashboard.consumeReset('one');
  f.requests[1].resolve({});
  await reset;
  assert.equal(f.dashboard.resetFeedback.value.one, 'error');
  assert.ok(f.dashboard.resetAttempts.value.one);
  const refresh = f.dashboard.refresh();
  f.requests[2].resolve({ error: 'AI room access denied' });
  await refresh;
  assert.deepEqual({ ...f.dashboard.resetAttempts.value }, {});
  assert.deepEqual({ ...f.dashboard.resetFeedback.value }, {});
  f.stop();
});
function resetControl(inlineTemplate = false) {
  const { parse, compileScript } = require('@vue/compiler-sfc');
  const filename = path.join(__dirname, '../src/pages/admin/BotResetCredits.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: filename, inlineTemplate }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) => (id === 'vue-i18n' ? { useI18n: () => ({ locale: vue.ref('en') }) } : require(id)),
    module,
    module.exports,
  );
  return module.exports.default;
}
test('reset control only emits after confirmation and rejects disabled actions', () => {
  const emitted = [];
  const props = vue.reactive({ bot: resetSnapshot.instances[0], pending: false, disabled: false, retry: false });
  const form = resetControl().setup(props, { expose() {}, emit: (...args) => emitted.push(args) });
  assert.deepEqual(emitted, []);
  form.open.value = true;
  assert.deepEqual(emitted, []);
  props.disabled = true;
  form.confirm();
  assert.deepEqual(emitted, []);
  props.disabled = false;
  form.confirm();
  assert.deepEqual(emitted, [['consume']]);
  assert.equal(form.open.value, false);
  props.bot = { id: 'one', quota: { resetCredits: { availableCount: 0, credits: [] } } };
  assert.equal(form.canReset.value, false);
  form.confirm();
  assert.equal(emitted.length, 1);
  props.retry = true;
  form.confirm();
  assert.equal(emitted.length, 2);
});
test('reset control renders credit count, expiry, unavailable state, and accessible result text', async () => {
  const { renderToString } = require('@vue/server-renderer');
  const render = async (bot, feedback) => {
    const app = vue.createSSRApp(resetControl(true), { bot, pending: false, disabled: false, retry: false, feedback });
    app.config.globalProperties.$t = (key, values) => key + (values ? JSON.stringify(values) : '');
    app.component('v-dialog', { template: '<div><slot name="activator" :props="{}" /></div>' });
    app.component('v-btn', { template: '<button><slot /></button>' });
    for (const tag of ['v-card', 'v-card-title', 'v-card-text', 'v-card-actions'])
      app.component(tag, { template: '<div><slot /></div>' });
    return renderToString(app);
  };
  const html = await render(resetSnapshot.instances[0], 'reset');
  assert.match(html, /resetCount.*count.*2/);
  assert.match(html, /resetExpires/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="[^"]*resetAccount/);
  const unavailable = await render({ id: 'missing' }, 'error');
  assert.match(unavailable, /resetUnavailable/);
  assert.match(unavailable, /role="alert"/);
});

test('reset noCredit is distinct and a replacement session ignores the previous acknowledgement', async () => {
  const f = fixture();
  f.requests[0].resolve(structuredClone(resetSnapshot));
  await tick();
  const reset = f.dashboard.consumeReset('one');
  f.requests[1].resolve({ outcome: 'noCredit' });
  await reset;
  assert.equal(f.dashboard.resetFeedback.value.one, 'noCredit');
  assert.equal(f.dashboard.resetAttempts.value.one, undefined);
  f.requests[2].resolve(structuredClone(resetSnapshot));
  await tick();
  const next = f.dashboard.consumeReset('one');
  assert.notEqual(f.requests[3].payload.idempotencyKey, f.requests[1].payload.idempotencyKey);
  f.store.state.profile = { id: 'other', token: 'two' };
  f.requests[3].resolve({ outcome: 'reset' });
  await next;
  assert.equal(f.dashboard.data.value, null);
  assert.deepEqual({ ...f.dashboard.resetFeedback.value }, {});
  f.stop();
});

test('configured account names matching Object properties get independent UUID reset attempts', async () => {
  const f = fixture();
  f.requests[0].resolve({
    ...snapshot,
    instances: ['constructor', 'toString'].map((id) => ({
      id,
      quota: { resetCredits: { availableCount: 1, credits: null } },
    })),
  });
  await tick();
  assert.equal(f.dashboard.resetAttempts.value.constructor, undefined);
  assert.equal(f.dashboard.resetFeedback.value.toString, undefined);
  const reset = f.dashboard.consumeReset('constructor');
  assert.equal(f.requests[1].payload.instanceID, 'constructor');
  assert.match(f.requests[1].payload.idempotencyKey, /^[a-f0-9-]{36}$/);
  f.requests[1].resolve({ outcome: 'reset' });
  await reset;
  assert.equal(f.dashboard.resetFeedback.value.constructor, 'reset');
  f.stop();
});
