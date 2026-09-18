import { createHash } from 'crypto';

export type DirectNetwork = 'btc' | 'tron' | 'eth' | 'bsc';
export function normalizeTxid(network: string, value: unknown): string {
  if (!['btc', 'tron', 'eth', 'bsc'].includes(network)) throw new Error('invalid_network');
  if (typeof value !== 'string') throw new Error('invalid_txid');
  const tx = value.trim().toLowerCase();
  if (network === 'eth' || network === 'bsc') {
    if (!/^0x[0-9a-f]{64}$/.test(tx)) throw new Error('invalid_txid');
  } else if (!/^[0-9a-f]{64}$/.test(tx)) throw new Error('invalid_txid');
  return tx;
}
export function tronHex(address: string): string {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) throw new Error('invalid_address');
  let value = 0n;
  for (const c of address)
    value = value * 58n + BigInt('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.indexOf(c));
  const bytes = Buffer.from(value.toString(16).padStart(50, '0'), 'hex');
  const digest = createHash('sha256')
    .update(createHash('sha256').update(bytes.subarray(0, 21)).digest())
    .digest();
  if (bytes.length !== 25 || bytes[0] !== 65 || !digest.subarray(0, 4).equals(bytes.subarray(21)))
    throw new Error('invalid_address');
  return bytes.subarray(0, 21).toString('hex');
}
export function validAddress(network: DirectNetwork, address: string): boolean {
  if (network === 'eth' || network === 'bsc') return /^0x[0-9a-fA-F]{40}$/.test(address) && !/^0x0{40}$/.test(address);
  if (network === 'tron') {
    try {
      tronHex(address);
      return true;
    } catch {
      return false;
    }
  }
  // Mainnet native SegWit only; validate the checksum and witness program length.
  if (address !== address.toLowerCase() || !address.startsWith('bc1') || address.length > 90) return false;
  const values = [...address.slice(3)].map((c) => 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'.indexOf(c));
  if (values.some((v) => v < 0) || values.length < 7 || values[0] > 16) return false;
  let check = 1;
  for (const value of [3, 3, 0, 2, 3, ...values]) {
    const top = check >>> 25;
    check = ((check & 0x1ffffff) << 5) ^ value;
    [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3].forEach((g, i) => {
      if ((top >>> i) & 1) check ^= g;
    });
  }
  if (check >>> 0 !== (values[0] === 0 ? 1 : 0x2bc830a3)) return false;
  const payload = values.slice(1, -6);
  const length = Math.floor((payload.length * 5) / 8);
  const padding = (payload.length * 5) % 8;
  return (
    length >= 2 &&
    length <= 40 &&
    padding < 5 &&
    (payload[payload.length - 1] & ((1 << padding) - 1)) === 0 &&
    (values[0] !== 0 || [20, 32].includes(length))
  );
}
export function formatAtomic(value: string, decimals: number): string {
  if (!/^\d+$/.test(value) || !Number.isInteger(decimals) || decimals < 0 || decimals > 18)
    throw new Error('invalid_amount');
  if (!decimals) return BigInt(value).toString();
  const s = BigInt(value)
    .toString()
    .padStart(decimals + 1, '0');
  const fraction = s.slice(-decimals).replace(/0+$/, '');
  return s.slice(0, -decimals) + (fraction ? '.' + fraction : '');
}
