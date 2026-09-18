import { configuredNetworks } from './config';
import { normalizeTxid, tronHex, formatAtomic } from './protocol';
import { readTransfer, valueTransfer, networkReady } from './chains';

const env = {
  DIRECT_SUPPORT_ENABLED: 'true',
  SUPPORT_BTC_API_URL: 'https://btc.example/api',
  SUPPORT_ETH_RPC_URL: 'https://eth.example',
  SUPPORT_BSC_RPC_URL: 'https://bsc.example',
  SUPPORT_TRON_API_URL: 'https://tron.example',
};
const tx = 'ab'.repeat(32);
const hash = 'cd'.repeat(32);
const event = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const fetchOriginal = global.fetch;
let responses: Record<string, unknown>;
let seen: string[];
beforeEach(() => {
  responses = {};
  seen = [];
  global.fetch = jest.fn(async (url, init) => {
    const request = init?.body ? JSON.parse(String(init.body)) : null;
    const key = request?.method ? `${request.method}:${JSON.stringify(request.params)}` : String(url);
    seen.push(key);
    if (!(key in responses)) throw new Error(`Unexpected request ${key}`);
    const value = responses[key];
    if (value instanceof Error) throw value;
    if (value instanceof Response) return value;
    return new Response(
      typeof value === 'string' && !request?.method
        ? value
        : JSON.stringify(request?.method ? { jsonrpc: '2.0', id: 1, result: value } : value),
    );
  });
});
afterEach(() => {
  global.fetch = fetchOriginal;
});
const cfg = (id: string) => configuredNetworks(env).find((n) => n.id === id)!;
function evm(id = 'eth') {
  const c = cfg(id);
  const receipt = {
    transactionHash: `0x${tx}`,
    status: '0x1',
    blockNumber: '0x64',
    blockHash: `0x${hash}`,
    logs: [
      {
        address: c.contract,
        topics: [`0x${event}`, `0x${'0'.repeat(64)}`, `0x${'0'.repeat(24)}${c.address.slice(2).toLowerCase()}`],
        data: '0x0000000000000000000000000000000000000000000000000000000000989680',
        logIndex: '0x0',
        removed: false,
      },
    ],
  };
  responses['eth_chainId:[]'] = id === 'eth' ? '0x1' : '0x38';
  responses[`eth_getTransactionReceipt:["0x${tx}"]`] = receipt;
  responses['eth_getBlockByNumber:["finalized",false]'] = { number: '0x65', hash: `0x${hash}` };
  responses['eth_getBlockByNumber:["0x64",false]'] = { number: '0x64', hash: `0x${hash}` };
  return receipt;
}
test('configuration is opt-in, validates recipients and never accepts arbitrary networks or URL protocols', () => {
  expect(configuredNetworks({})).toEqual([]);
  expect(configuredNetworks(env)).toHaveLength(4);
  expect(configuredNetworks({ ...env, SUPPORT_ETH_ADDRESS: 'wrong' }).map((n) => n.id)).not.toContain('eth');
  expect(configuredNetworks({ ...env, SUPPORT_BTC_API_URL: 'file:///etc/passwd' }).map((n) => n.id)).not.toContain(
    'btc',
  );
  expect(() => normalizeTxid('eth', `https://example.com/${tx}`)).toThrow('invalid_txid');
  expect(normalizeTxid('eth', `0X${tx.toUpperCase()}`)).toBe(`0x${tx}`);
  expect(() => normalizeTxid('doge', tx)).toThrow('invalid_network');
  expect(tronHex(cfg('tron').address)).toMatch(/^41[a-f0-9]{40}$/);
  expect(formatAtomic('123456789123456789', 18)).toBe('0.123456789123456789');
});
test.each(['eth', 'bsc'])('%s counts only matching token events to recipient and requires finality', async (id) => {
  const r = evm(id);
  r.logs.push({ ...r.logs[0], logIndex: '0x1' });
  r.logs.push({ ...r.logs[0], address: `0x${'ff'.repeat(20)}`, logIndex: '0x2' });
  expect(await readTransfer(cfg(id), `0x${tx}`)).toMatchObject({
    status: 'verified',
    amountAtomic: '20000000',
    blockHeight: 100,
  });
  responses['eth_getBlockByNumber:["finalized",false]'] = { number: '0x63', hash: `0x${hash}` };
  expect(await readTransfer(cfg(id), `0x${tx}`)).toMatchObject({ status: 'confirming' });
});
test('EVM rejects failed receipts, wrong recipient, wrong chain and reorgs', async () => {
  const r = evm();
  r.status = '0x0';
  expect((await readTransfer(cfg('eth'), `0x${tx}`)).status).toBe('rejected');
  r.status = '0x1';
  r.logs[0].topics[2] = `0x${'0'.repeat(64)}`;
  expect((await readTransfer(cfg('eth'), `0x${tx}`)).status).toBe('rejected');
  evm();
  responses['eth_chainId:[]'] = '0x38';
  await expect(readTransfer(cfg('eth'), `0x${tx}`)).rejects.toThrow();
  evm();
  responses['eth_getBlockByNumber:["0x64",false]'] = { number: '0x64', hash: `0x${'ee'.repeat(32)}` };
  expect((await readTransfer(cfg('eth'), `0x${tx}`)).status).toBe('confirming');
});
test('EVM rejects mismatched transaction hashes and malformed amounts rather than granting', async () => {
  const r = evm();
  r.transactionHash = `0x${hash}`;
  await expect(readTransfer(cfg('eth'), `0x${tx}`)).rejects.toThrow();
  r.transactionHash = `0x${tx}`;
  r.logs[0].data = '0xnothex';
  await expect(readTransfer(cfg('eth'), `0x${tx}`)).rejects.toThrow();
});
test('BTC sums recipient outputs and credits one canonical confirmation', async () => {
  const c = cfg('btc');
  responses[`${c.url}/tx/${tx}`] = {
    txid: tx,
    vout: [
      { scriptpubkey_address: c.address, value: 12000 },
      { scriptpubkey_address: c.address, value: 3000 },
      { scriptpubkey_address: 'other', value: 900000 },
    ],
    status: { confirmed: true, block_height: 100, block_hash: hash },
  };
  responses[`${c.url}/blocks/tip/height`] = '99';
  responses[`${c.url}/block-height/100`] = hash;
  expect((await readTransfer(c, tx)).status).toBe('confirming');
  responses[`${c.url}/blocks/tip/height`] = '100';
  expect(await readTransfer(c, tx)).toMatchObject({ status: 'verified', amountAtomic: '15000' });
  responses[`${c.url}/block-height/100`] = 'ee'.repeat(32);
  expect((await readTransfer(c, tx)).status).toBe('confirming');
});
test('BTC 404 is pending, provider outage is retryable and cannot mean rejected', async () => {
  const c = cfg('btc');
  responses[`${c.url}/tx/${tx}`] = new Response('not found', { status: 404 });
  expect((await readTransfer(c, tx)).status).toBe('waiting');
  responses[`${c.url}/tx/${tx}`] = new Response('unavailable', { status: 503 });
  await expect(readTransfer(c, tx)).rejects.toThrow();
});
test('TRON reads successful solidified receipt and matches the contract, not token symbol', async () => {
  const c = cfg('tron');
  const receipt = {
    id: tx,
    blockNumber: 100,
    receipt: { result: 'SUCCESS' },
    log: [
      {
        address: tronHex(c.contract!).slice(2),
        topics: [event, '0'.repeat(64), '0'.repeat(24) + tronHex(c.address).slice(2)],
        data: '0'.repeat(58) + '989680',
      },
    ],
  };
  responses[`${c.url}/walletsolidity/gettransactioninfobyid`] = receipt;
  responses[`${c.url}/walletsolidity/getblockbynum`] = {
    blockID: hash,
    block_header: { raw_data: { number: 100 } },
    transactions: [{ txID: tx }],
  };
  expect(await readTransfer(c, tx)).toMatchObject({ status: 'verified', amountAtomic: '10000000' });
  receipt.receipt.result = 'REVERT';
  expect((await readTransfer(c, tx)).status).toBe('rejected');
  receipt.receipt.result = 'SUCCESS';
  receipt.log[0].address = 'ff'.repeat(20);
  expect((await readTransfer(c, tx)).status).toBe('rejected');
});
test('missing solidified receipt remains pending; API Error is not a rejected payment', async () => {
  const c = cfg('tron');
  responses[`${c.url}/walletsolidity/gettransactioninfobyid`] = {};
  expect((await readTransfer(c, tx)).status).toBe('waiting');
  responses[`${c.url}/walletsolidity/gettransactioninfobyid`] = { Error: 'quota' };
  await expect(readTransfer(c, tx)).rejects.toThrow();
});
test('USDT decimals and sub-cent amounts do not round up or use floating point', async () => {
  expect(await valueTransfer(cfg('eth'), '10009999')).toMatchObject({ amountCents: 1000, usdRate: '1' });
  expect(await valueTransfer(cfg('bsc'), '10009999999999999999')).toMatchObject({ amountCents: 1000 });
  expect(await valueTransfer(cfg('eth'), '9999')).toMatchObject({ amountCents: 0 });
  await expect(valueTransfer(cfg('bsc'), '9'.repeat(80))).rejects.toThrow();
});
test('BTC valuation saves a fresh rate and rejects stale, invalid or future quotes', async () => {
  const url = 'https://api.exchange.coinbase.com/products/BTC-USD/ticker';
  responses[url] = { price: '65000.123456', time: new Date().toISOString() };
  expect(await valueTransfer(cfg('btc'), '15000')).toMatchObject({
    amountCents: 975,
    usdRate: '65000.123456',
    rateSource: 'coinbase:BTC-USD',
  });
  responses[url] = { price: '65000', time: '2020-01-01T00:00:00Z' };
  await expect(valueTransfer(cfg('btc'), '15000')).rejects.toThrow();
  responses[url] = { price: '-3', time: new Date().toISOString() };
  await expect(valueTransfer(cfg('btc'), '15000')).rejects.toThrow();
});
test('readiness requires chain identity, finalized block and configured token decimals', async () => {
  evm();
  const c = cfg('eth');
  responses[`eth_call:[{"to":"${c.contract}","data":"0x313ce567"},"latest"]`] = '0x6';
  expect(await networkReady(c)).toBe(true);
  responses['eth_getBlockByNumber:["finalized",false]'] = null;
  expect(await networkReady(c)).toBe(false);
});
test('TRON readiness rejects a testnet endpoint even when it has solidified blocks', async () => {
  const c = cfg('tron');
  responses[`${c.url}/walletsolidity/getnowblock`] = { blockID: hash, block_header: { raw_data: { number: 100 } } };
  responses[`${c.url}/walletsolidity/getblockbynum`] = { blockID: 'ee'.repeat(32) };
  expect(await networkReady(c)).toBe(false);
  responses[`${c.url}/walletsolidity/getblockbynum`] = {
    blockID: '00000000000000001ebf88508a03865c71d452e25f4d51194196a1d22b6653dc',
  };
  expect(await networkReady(c)).toBe(true);
});
test('BTC never credits an unmined transfer and rejects wrong recipient', async () => {
  const c = cfg('btc');
  const payment = { txid: tx, vout: [{ scriptpubkey_address: c.address, value: 100 }], status: { confirmed: false } };
  responses[`${c.url}/tx/${tx}`] = payment;
  expect((await readTransfer(c, tx)).status).toBe('confirming');
  payment.vout[0].scriptpubkey_address = 'someone-else';
  expect((await readTransfer(c, tx)).status).toBe('rejected');
});
