const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { isSupportAmount, safeCheckoutURL } = require('../src/pages/support/checkout.ts');
test('checkout accepts USD cents within the backend limits', () => {
  for (const value of ['1', '10', '12.34', '10000']) assert.equal(isSupportAmount(value), true);
  for (const value of ['', '0', '0.99', '10000.01', '1.001', '1e2', '-10', 'NaN'])
    assert.equal(isSupportAmount(value), false);
});
test('checkout and history links accept only trusted OxaPay HTTPS hosts', () => {
  for (const host of ['oxapay.com', 'pay.oxapay.com'])
    assert.equal(safeCheckoutURL(`https://${host}/invoice/123`), `https://${host}/invoice/123`);
  for (const value of [
    undefined,
    '',
    'javascript:alert(1)',
    'https://nowpayments.io/123',
    'http://pay.oxapay.com',
    'https://oxapay.com.evil.test',
    'https://user@oxapay.com/123',
    'https://pay.oxapay.com:8080/123',
  ])
    assert.equal(safeCheckoutURL(value), undefined);
});
