const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { fullStylesReady } = require('../src/helpers/critical-css.ts');

test('activation waits for every deferred stylesheet; failed CSS does not hang startup', async () => {
  const first = new EventTarget();
  const second = new EventTarget();
  global.document = { querySelectorAll: () => [first, second] };
  let ready = false;
  const completion = fullStylesReady().then(() => (ready = true));
  await Promise.resolve();
  assert.equal(ready, false);
  first.dispatchEvent(new Event('load'));
  await Promise.resolve();
  assert.equal(ready, false);
  second.dispatchEvent(new Event('error'));
  await completion;
  assert.equal(ready, true);
  delete global.document;
});
