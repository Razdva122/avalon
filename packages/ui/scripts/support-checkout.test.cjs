const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { isSupportTxid, supportError } = require('../src/pages/support/checkout.ts');
test('txid input validates the selected network without accepting wallet addresses or URLs', () => {
  for (const network of ['btc', 'tron']) {
    assert.equal(isSupportTxid(network, 'ab'.repeat(32)), true);
    assert.equal(isSupportTxid(network, '0x' + 'ab'.repeat(32)), false);
  }
  for (const network of ['eth', 'bsc']) {
    assert.equal(isSupportTxid(network, ' 0x' + 'AB'.repeat(32) + ' '), true);
    assert.equal(isSupportTxid(network, '0x' + 'ab'.repeat(20)), false);
  }
  for (const value of ['', 'https://explorer.test/tx/' + 'ab'.repeat(32), 'ab'.repeat(31)])
    assert.equal(isSupportTxid('btc', value), false);
  assert.equal(isSupportTxid('unknown', 'ab'.repeat(32)), false);
});
test('API errors give actionable messages without exposing backend payloads', () => {
  assert.equal(supportError(409, 'already_claimed'), 'alreadyClaimed');
  assert.equal(supportError(400, 'invalid_txid'), 'invalidTxid');
  assert.equal(supportError(429, 'too_many_requests'), 'rateError');
  assert.equal(supportError(401, 'unauthorized'), 'authError');
  assert.equal(supportError(503, 'some secret response'), 'error');
});
