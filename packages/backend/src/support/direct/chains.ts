import { NetworkConfig } from './config';
import { normalizeTxid, tronHex } from './protocol';
import { readHTTP, record, rpc } from './http';

export interface TransferResult {
  status: 'waiting' | 'confirming' | 'rejected' | 'verified';
  amountAtomic?: string;
  blockHash?: string;
  blockHeight?: number;
}
export interface Valuation {
  amountCents: number;
  usdRate: string;
  rateSource: string;
  valuedAt: Date;
}
const transferTopic = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
function hex(value: unknown, bytes?: number): string {
  if (
    typeof value !== 'string' ||
    !/^0x[0-9a-f]+$/i.test(value) ||
    (bytes !== undefined && value.length !== 2 + bytes * 2)
  )
    throw new Error('invalid_response');
  return value.toLowerCase();
}
function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid_response');
  return value;
}
function quantity(value: unknown): number {
  return integer(Number(BigInt(hex(value))));
}
function hash(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('invalid_response');
  return value.toLowerCase();
}
function logsAmount(logs: unknown, token: string, recipient: string, tron = false): bigint {
  if (!Array.isArray(logs)) throw new Error('invalid_response');
  let total = 0n;
  const seen = new Set<string>();
  for (const raw of logs) {
    const log = record(raw);
    const address = typeof log.address === 'string' ? log.address.toLowerCase().replace(/^0x/, '') : '';
    if (address !== token || log.removed === true) continue;
    const topics = log.topics;
    if (
      !Array.isArray(topics) ||
      topics.length !== 3 ||
      typeof topics[0] !== 'string' ||
      topics[0].replace(/^0x/, '').toLowerCase() !== transferTopic
    )
      continue;
    const to = hex(tron ? `0x${topics[2]}` : topics[2], 32);
    if (to !== `0x${'0'.repeat(24)}${recipient}`) continue;
    hex(tron ? `0x${topics[1]}` : topics[1], 32);
    if (!tron) {
      const index = hex(log.logIndex);
      if (seen.has(index)) throw new Error('invalid_response');
      seen.add(index);
    }
    total += BigInt(hex(tron ? `0x${log.data}` : log.data, 32));
  }
  return total;
}
async function bitcoin(c: NetworkConfig, txid: string): Promise<TransferResult> {
  const raw = await readHTTP(`${c.url}/tx/${txid}`, undefined, undefined, true);
  if (raw === null) return { status: 'waiting' };
  const tx = record(raw);
  if (hash(tx.txid) !== txid || !Array.isArray(tx.vout)) throw new Error('invalid_response');
  let amount = 0n;
  for (const rawOutput of tx.vout) {
    const output = record(rawOutput);
    if (output.scriptpubkey_address === c.address) amount += BigInt(integer(output.value));
  }
  if (amount <= 0n) return { status: 'rejected' };
  const status = record(tx.status);
  if (status.confirmed === false) return { status: 'confirming' };
  if (status.confirmed !== true) throw new Error('invalid_response');
  const height = integer(status.block_height);
  const blockHash = hash(status.block_hash);
  const tip = integer(Number(await readHTTP(`${c.url}/blocks/tip/height`)));
  if (tip - height + 1 < 1) return { status: 'confirming' };
  if (hash(await readHTTP(`${c.url}/block-height/${height}`)) !== blockHash) return { status: 'confirming' };
  return { status: 'verified', amountAtomic: amount.toString(), blockHash, blockHeight: height };
}
async function evm(c: NetworkConfig, txid: string): Promise<TransferResult> {
  if (hex(await rpc(c.url, 'eth_chainId', [])) !== c.chainId) throw new Error('wrong_chain');
  const raw = await rpc(c.url, 'eth_getTransactionReceipt', [txid]);
  if (raw === null) return { status: 'waiting' };
  const receipt = record(raw);
  if (hex(receipt.transactionHash, 32) !== txid) throw new Error('invalid_response');
  if (receipt.status === '0x0') return { status: 'rejected' };
  if (receipt.status !== '0x1') throw new Error('invalid_response');
  const amount = logsAmount(receipt.logs, c.contract!.slice(2).toLowerCase(), c.address.slice(2).toLowerCase());
  if (amount <= 0n) return { status: 'rejected' };
  const height = quantity(receipt.blockNumber);
  const blockHash = hex(receipt.blockHash, 32);
  const finalized = record(await rpc(c.url, 'eth_getBlockByNumber', ['finalized', false]));
  if (quantity(finalized.number) < height) return { status: 'confirming' };
  hex(finalized.hash, 32);
  const canonical = record(await rpc(c.url, 'eth_getBlockByNumber', [receipt.blockNumber, false]));
  if (quantity(canonical.number) !== height || hex(canonical.hash, 32) !== blockHash) return { status: 'confirming' };
  return { status: 'verified', amountAtomic: amount.toString(), blockHash, blockHeight: height };
}
async function tron(c: NetworkConfig, txid: string): Promise<TransferResult> {
  const receipt = record(await readHTTP(`${c.url}/walletsolidity/gettransactioninfobyid`, { value: txid }, c.apiKey));
  if (receipt.Error || receipt.error || receipt.code) throw new Error('provider_unavailable');
  if (Object.keys(receipt).length === 0) return { status: 'waiting' };
  if (hash(receipt.id) !== txid) throw new Error('invalid_response');
  const result = record(receipt.receipt).result;
  if (result !== 'SUCCESS') {
    if (typeof result !== 'string' || !result) throw new Error('invalid_response');
    return { status: 'rejected' };
  }
  const amount = logsAmount(receipt.log ?? [], tronHex(c.contract!).slice(2), tronHex(c.address).slice(2), true);
  if (amount <= 0n) return { status: 'rejected' };
  const height = integer(receipt.blockNumber);
  const block = record(await readHTTP(`${c.url}/walletsolidity/getblockbynum`, { num: height }, c.apiKey));
  const blockHash = hash(block.blockID);
  if (integer(record(record(block.block_header).raw_data).number) !== height || !Array.isArray(block.transactions))
    throw new Error('invalid_response');
  if (!block.transactions.some((t) => record(t).txID === txid)) return { status: 'confirming' };
  return { status: 'verified', amountAtomic: amount.toString(), blockHash, blockHeight: height };
}
export async function readTransfer(c: NetworkConfig, input: string): Promise<TransferResult> {
  const txid = normalizeTxid(c.id, input);
  return c.id === 'btc' ? bitcoin(c, txid) : c.id === 'tron' ? tron(c, txid) : evm(c, txid);
}
export async function valueTransfer(c: NetworkConfig, atomic: string, now = new Date()): Promise<Valuation> {
  if (!/^\d{1,78}$/.test(atomic) || BigInt(atomic) <= 0n) throw new Error('invalid_amount');
  let price = '1';
  let rateSource = 'fixed:USDT-USD';
  if (c.asset === 'BTC') {
    const ticker = record(await readHTTP('https://api.exchange.coinbase.com/products/BTC-USD/ticker'));
    const time = typeof ticker.time === 'string' ? Date.parse(ticker.time) : NaN;
    if (
      !Number.isFinite(time) ||
      now.getTime() - time > 300000 ||
      time > now.getTime() + 30000 ||
      typeof ticker.price !== 'string'
    )
      throw new Error('invalid_rate');
    price = ticker.price;
    rateSource = 'coinbase:BTC-USD';
  }
  if (!/^\d{1,12}(\.\d{1,12})?$/.test(price)) throw new Error('invalid_rate');
  const [whole, fraction = ''] = price.split('.');
  const scaled = BigInt(whole + fraction);
  if (scaled <= 0n) throw new Error('invalid_rate');
  const cents = (BigInt(atomic) * scaled * 100n) / 10n ** BigInt(c.decimals + fraction.length);
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('invalid_amount');
  return { amountCents: Number(cents), usdRate: price, rateSource, valuedAt: now };
}
export async function networkReady(c: NetworkConfig): Promise<boolean> {
  try {
    if (c.chainId) {
      if (hex(await rpc(c.url, 'eth_chainId', [])) !== c.chainId) return false;
      const block = record(await rpc(c.url, 'eth_getBlockByNumber', ['finalized', false]));
      quantity(block.number);
      hex(block.hash, 32);
      return quantity(await rpc(c.url, 'eth_call', [{ to: c.contract, data: '0x313ce567' }, 'latest'])) === c.decimals;
    }
    if (c.id === 'btc')
      return (
        (await readHTTP(`${c.url}/block-height/0`)) ===
        '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
      );
    const genesis = record(await readHTTP(`${c.url}/walletsolidity/getblockbynum`, { num: 0 }, c.apiKey));
    if (genesis.blockID !== '00000000000000001ebf88508a03865c71d452e25f4d51194196a1d22b6653dc') return false;
    const block = record(await readHTTP(`${c.url}/walletsolidity/getnowblock`, {}, c.apiKey));
    hash(block.blockID);
    return integer(record(record(block.block_header).raw_data).number) > 0;
  } catch {
    return false;
  }
}
