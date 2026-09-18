export function isSupportTxid(network: string, value: string): boolean {
  const txid = value.trim();
  if (['btc', 'tron'].includes(network)) return /^[a-f0-9]{64}$/i.test(txid);
  if (['eth', 'bsc'].includes(network)) return /^0x[a-f0-9]{64}$/i.test(txid);
  return false;
}
export function supportError(status: number, error: unknown): string {
  if (status === 401) return 'authError';
  if (status === 429) return 'rateError';
  if (status === 409 && error === 'already_claimed') return 'alreadyClaimed';
  if (status === 400 && error === 'invalid_txid') return 'invalidTxid';
  if (status === 400 && error === 'invalid_network') return 'unavailable';
  return 'error';
}
