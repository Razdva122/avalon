const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { startup, gtag, yaMetrika } = require('../const');

function run({ prerender = false, pathname = '/' } = {}) {
  const scripts = [];
  const events = new EventTarget();
  const document = {
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    visibilityState: 'visible',
    scripts,
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
    getElementsByTagName: () => [{ parentNode: { insertBefore: (script) => scripts.push(script) } }],
  };
  const timers = [];
  const context = vm.createContext({
    document,
    location: { pathname },
    setTimeout: (callback) => timers.push(callback),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
  context.window = context;
  if (prerender) context.__AVALON_PRERENDER__ = { prerender: true };
  const execute = () => {
    for (const html of [startup || '', gtag, yaMetrika]) {
      for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) vm.runInContext(script, context);
    }
  };
  execute();
  execute();
  return {
    scripts,
    context,
    ready: () => events.dispatchEvent(new Event('avalon:ready')),
    flush: () => {
      while (timers.length) timers.shift()();
    },
    hidden: () => {
      document.visibilityState = 'hidden';
      events.dispatchEvent(new Event('visibilitychange'));
    },
  };
}

test('prerender does not bake third-party analytics scripts into the HTML', () => {
  const { scripts } = run({ prerender: true });
  assert.equal(scripts.length, 0);
});

test('repeated bootstrap loads each analytics provider only once', () => {
  const { scripts, context, ready, flush } = run();
  assert.equal(scripts.length, 0, 'analytics must not compete with hydration');
  ready();
  assert.equal(scripts.length, 0, 'loading waits for a later task');
  flush();
  ready();
  flush();
  assert.equal(scripts.filter((s) => s.src.includes('googletagmanager')).length, 1);
  assert.equal(scripts.filter((s) => s.src.includes('mc.yandex')).length, 1);
  assert.equal(context.dataLayer.filter((args) => args[0] === 'config').length, 1);
});

test('password recovery never loads analytics', () => {
  assert.equal(run({ pathname: '/password-recovery/' }).scripts.length, 0);
});

test('early hidden page drains queued analytics only once', () => {
  const { scripts, context, hidden, ready, flush } = run();
  assert.equal(scripts.length, 0);
  assert.equal(context.dataLayer.filter((args) => args[0] === 'config').length, 1);
  hidden();
  hidden();
  ready();
  flush();
  assert.equal(scripts.length, 2);
});
