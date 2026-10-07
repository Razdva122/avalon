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

test('board filters preserve position and pagination returns to results while history keeps its saved position', () => {
  const from = { path: '/ru/community/groups/', hash: '', query: { language: 'ru' } };
  const to = { ...from, query: { language: 'ru', communication: 'text' } };
  assert.equal(scrollBehavior(to, from, null), false);
  assert.deepEqual(scrollBehavior({ ...to, query: { ...to.query, page: '2' } }, to, null), {
    el: '#player-boards',
    top: 80,
  });
  const saved = { top: 450, left: 0 };
  assert.equal(scrollBehavior(from, to, saved), saved);
});
