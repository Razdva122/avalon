const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { gtag, yaMetrika } = require('../const');

function run({ prerender = false, pathname = '/' } = {}) {
  const scripts = [];
  const document = {
    scripts,
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
    getElementsByTagName: () => [{ parentNode: { insertBefore: (script) => scripts.push(script) } }],
  };
  const context = vm.createContext({ document, location: { pathname } });
  context.window = context;
  if (prerender) context.__AVALON_PRERENDER__ = { prerender: true };
  const execute = () => {
    for (const html of [gtag, yaMetrika]) {
      for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) vm.runInContext(script, context);
    }
  };
  execute();
  execute();
  return { scripts, context };
}

test('prerender does not bake third-party analytics scripts into the HTML', () => {
  const { scripts } = run({ prerender: true });
  assert.equal(scripts.length, 0);
});

test('repeated bootstrap loads each analytics provider only once', () => {
  const { scripts, context } = run();
  assert.equal(scripts.filter((s) => s.src.includes('googletagmanager')).length, 1);
  assert.equal(scripts.filter((s) => s.src.includes('mc.yandex')).length, 1);
  assert.equal(context.dataLayer.filter((args) => args[0] === 'config').length, 1);
});

test('password recovery never loads analytics', () => {
  assert.equal(run({ pathname: '/password-recovery/' }).scripts.length, 0);
});
