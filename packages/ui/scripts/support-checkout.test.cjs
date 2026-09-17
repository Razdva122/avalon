const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { selectSupportNetwork, canPayAmount } = require('../src/pages/support/checkout.ts');
const networks = [
  { currency: 'usdttrc20', available: true, minimumUSD: 16.54 },
  { currency: 'usdterc20', available: false },
  { currency: 'usdtbsc', available: true, minimumUSD: 4.65 },
];
test('initial $10 checkout selects an affordable network instead of blocking on TRON', () => {
  assert.equal(selectSupportNetwork(networks, '', 10), 'usdtbsc');
});
test('refresh preserves an explicitly selected available network even below minimum', () => {
  assert.equal(selectSupportNetwork(networks, 'usdttrc20', 10), 'usdttrc20');
});
test('replaces an unavailable selection and chooses lowest minimum when none are affordable', () => {
  assert.equal(selectSupportNetwork(networks, 'usdterc20', 10), 'usdtbsc');
  assert.equal(selectSupportNetwork(networks, '', 1), 'usdtbsc');
  assert.equal(selectSupportNetwork([], 'usdttrc20', 10), '');
});
test('payment and presets require an available quote and an amount meeting its minimum', () => {
  assert.equal(canPayAmount(networks[0], 10), false);
  assert.equal(canPayAmount(networks[0], 16.54), true);
  assert.equal(canPayAmount(networks[1], 20), false);
  assert.equal(canPayAmount(undefined, 20), false);
  assert.equal(canPayAmount({ currency: 'usdtbsc', available: true }, 10), false);
});
