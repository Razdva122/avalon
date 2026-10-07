const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { parse } = require('@vue/compiler-sfc');
const { createRenderer, h, nextTick, ref } = require('vue');

const { descriptor } = parse(fs.readFileSync(require.resolve('../src/components/feedback/Timer.vue'), 'utf8'));
const componentExports = {};
new Function(
  'require',
  'exports',
  ts.transpileModule(descriptor.script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(require, componentExports);
const Timer = { ...componentExports.default, render: () => null };

function mountTimer(context, initialDuration) {
  // Browser intervals use numeric IDs. Node 23's MockTimers requeues an interval
  // cleared inside its own callback, so control just this clock boundary.
  let now = 0;
  let nextID = 1;
  const intervals = new Map();
  context.mock.method(globalThis, 'setInterval', (callback, delay) => {
    const id = nextID++;
    intervals.set(id, { callback, delay, next: now + delay });
    return id;
  });
  context.mock.method(globalThis, 'clearInterval', (id) => intervals.delete(id));
  const tick = (milliseconds) => {
    const end = now + milliseconds;
    for (;;) {
      const next = Math.min(...Array.from(intervals.values(), (interval) => interval.next));
      if (next > end) break;
      now = next;
      for (const interval of Array.from(intervals.values())) {
        if (interval.next === now) {
          interval.next += interval.delay;
          interval.callback();
        }
      }
    }
    now = end;
  };
  const duration = ref(initialDuration);
  const eventIndex = ref(0);
  const events = [];
  let timer;
  const renderer = createRenderer({
    createComment: () => ({}),
    createText: () => ({}),
    createElement: () => ({}),
    insert() {},
    remove() {},
    setText() {},
    setElementText() {},
    parentNode: () => null,
    nextSibling: () => null,
    patchProp() {},
  });
  const app = renderer.createApp({
    render: () =>
      h(Timer, {
        duration: duration.value,
        key: eventIndex.value,
        ref: (instance) => {
          timer = instance;
        },
        onTimerEnd: () => events.push('timerEnd'),
      }),
  });
  app.mount({});
  context.after(() => app.unmount());
  return {
    duration,
    eventIndex,
    events,
    app,
    tick,
    get timer() {
      return timer;
    },
  };
}

test('ten second timer ends once at zero, without an extra second', async (context) => {
  const mounted = mountTimer(context, 10000);
  mounted.tick(9000);
  await nextTick();
  assert.equal(mounted.timer.time, 1000);
  assert.deepEqual(mounted.events, []);
  mounted.tick(1000);
  await nextTick();
  assert.equal(mounted.timer.time, 0);
  assert.deepEqual(mounted.events, ['timerEnd']);
  mounted.tick(5000);
  assert.equal(mounted.timer.time, 0);
  assert.deepEqual(mounted.events, ['timerEnd']);
});

test('changing duration cancels the previous countdown before restarting', async (context) => {
  const mounted = mountTimer(context, 10000);
  mounted.tick(3000);
  mounted.duration.value = 2000;
  await nextTick();
  assert.equal(mounted.timer.time, 2000);
  mounted.tick(1000);
  await nextTick();
  assert.equal(mounted.timer.time, 1000);
  assert.deepEqual(mounted.events, []);
  mounted.tick(1000);
  await nextTick();
  assert.equal(mounted.timer.time, 0);
  assert.deepEqual(mounted.events, ['timerEnd']);
});

test('unmounting cancels countdown instead of firing into a later event', (context) => {
  const mounted = mountTimer(context, 10000);
  const timer = mounted.timer;
  mounted.tick(2000);
  mounted.app.unmount();
  mounted.tick(15000);
  assert.equal(timer.time, 8000);
  assert.deepEqual(mounted.events, []);
});

test('consecutive history events each count down even when both last ten seconds', async (context) => {
  const board = fs.readFileSync(require.resolve('../src/components/view/board/Board.vue'), 'utf8');
  assert.match(board, /<Timer[^>]*:key="visibleHistoryIndex"/);
  const mounted = mountTimer(context, 10000);
  mounted.tick(10000);
  await nextTick();
  assert.deepEqual(mounted.events, ['timerEnd']);
  // Board clears one history event and schedules the next in the same Vue flush.
  mounted.duration.value = 0;
  mounted.duration.value = 10000;
  mounted.eventIndex.value++;
  await nextTick();
  assert.equal(mounted.timer.time, 10000);
  mounted.tick(10000);
  await nextTick();
  assert.deepEqual(mounted.events, ['timerEnd', 'timerEnd']);
});
