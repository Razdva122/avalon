const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { scrollBehavior } = require('../src/router/scroll.ts');

test('rules fragments reach their section below the fixed header', () => {
  assert.deepEqual(scrollBehavior({ hash: '#mission-sizes' }, {}, null), { el: '#mission-sizes', top: 80 });
});
test('history restores the saved position and ordinary navigation starts at the top', () => {
  const saved = { left: 0, top: 1234 };
  assert.equal(scrollBehavior({ hash: '#mission-sizes' }, {}, saved), saved);
  assert.deepEqual(scrollBehavior({ hash: '' }, {}, null), { top: 0 });
});
