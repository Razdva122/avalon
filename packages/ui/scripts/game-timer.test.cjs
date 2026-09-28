const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  ts = require('typescript'),
  vue = require('vue');
function timer() {
  let now = 100000,
    mounted,
    unmounted,
    callback;
  const events = [];
  const source = fs
    .readFileSync(require.resolve('../src/components/feedback/GameTimer.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', 'Date', 'window', code)(
    (id) => (id === 'vue' ? { ...vue, onMounted: (f) => (mounted = f), onUnmounted: (f) => (unmounted = f) } : {}),
    exports,
    { now: () => now },
    {
      setInterval: (f) => ((callback = f), 1),
      clearInterval: () => {
        callback = undefined;
      },
    },
  );
  const props = vue.reactive({ endTime: now + 150000, isCustom: true, active: true });
  const scope = vue.effectScope();
  const state = scope.run(() => exports.default.setup(props, { emit: (...args) => events.push(args) }));
  mounted();
  return {
    props,
    state,
    events,
    tick(ms) {
      now += ms;
      callback?.();
    },
    stop() {
      unmounted();
      scope.stop();
    },
  };
}
test('countdown keeps mm:ss and finishes exactly at deadline once', () => {
  const t = timer();
  assert.equal(t.state.timeInString.value, '02:30');
  t.tick(149001);
  assert.equal(t.state.timeInString.value, '00:01');
  assert.equal(t.events.length, 0);
  t.tick(999);
  assert.equal(t.state.timeInString.value, '00:00');
  assert.equal(t.events.length, 1);
  t.tick(5000);
  assert.equal(t.events.length, 1);
  t.stop();
});
test('stopping suppresses completion; a new deadline restarts after expiry', async () => {
  const t = timer();
  t.props.active = false;
  await vue.nextTick();
  t.tick(200000);
  assert.equal(t.state.timeInString.value, '00:00');
  assert.equal(t.events.length, 0);
  t.props.endTime = 302000;
  t.props.active = true;
  await vue.nextTick();
  assert.equal(t.state.timeInString.value, '00:02');
  t.tick(2000);
  assert.equal(t.events.length, 1);
  t.props.endTime = 305000;
  await vue.nextTick();
  assert.equal(t.state.timeInString.value, '00:03');
  t.tick(3000);
  assert.equal(t.events.length, 2);
  t.stop();
});

test('minute shortcut is available only when permitted on a manual timer', () => {
  const t = timer();
  t.state.addMinute();
  assert.equal(t.events.length, 0);
  t.props.canAdjust = true;
  t.state.addMinute();
  assert.deepEqual(t.events, [['addMinute']]);
  t.props.isCustom = false;
  t.state.addMinute();
  assert.equal(t.events.length, 1);
  t.stop();
});

function pointer(overrides = {}) {
  return { pointerType: 'touch', pointerId: 1, isPrimary: true, clientX: 20, clientY: 20, ...overrides };
}
function tap(t, overrides = {}, duration = 60) {
  const event = pointer(overrides);
  t.state.onPointerDown(event);
  t.tick(duration);
  t.state.onPointerUp(event);
}
test('two nearby touch taps add one minute and ignore the synthetic double click', () => {
  const t = timer();
  t.props.canAdjust = true;
  tap(t);
  assert.equal(t.events.length, 0);
  t.tick(120);
  tap(t);
  t.state.onDoubleClick();
  assert.deepEqual(t.events, [['addMinute']]);
  t.tick(900);
  t.state.onDoubleClick();
  assert.equal(t.events.length, 2);
  t.stop();
});
test('slow taps, dragging, cancellation and long press do not add time', () => {
  const t = timer();
  t.props.canAdjust = true;
  tap(t);
  t.tick(500);
  tap(t);
  assert.equal(t.events.length, 0);
  t.state.onPointerDown(pointer());
  t.state.onPointerMove(pointer({ clientX: 70 }));
  t.state.onPointerUp(pointer());
  tap(t);
  assert.equal(t.events.length, 0);
  t.state.onPointerDown(pointer());
  t.state.onPointerCancel();
  tap(t);
  assert.equal(t.events.length, 0);
  tap(t, {}, 600);
  tap(t);
  assert.equal(t.events.length, 0);
  t.stop();
});
test('touch shortcut respects permissions and ignores mouse pointer events', () => {
  const t = timer();
  tap(t);
  tap(t);
  assert.equal(t.events.length, 0);
  t.props.canAdjust = true;
  t.props.isCustom = false;
  tap(t);
  tap(t);
  assert.equal(t.events.length, 0);
  t.props.isCustom = true;
  t.tick(900);
  tap(t, { pointerType: 'mouse' });
  tap(t, { pointerType: 'mouse' });
  assert.equal(t.events.length, 0);
  t.state.onDoubleClick();
  assert.deepEqual(t.events, [['addMinute']]);
  t.stop();
});
