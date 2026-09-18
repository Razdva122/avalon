import { DirectNetwork, validAddress } from './protocol';
export interface NetworkConfig {
  id: DirectNetwork;
  label: string;
  asset: 'BTC' | 'USDT';
  address: string;
  decimals: number;
  contract?: string;
  chainId?: string;
  url: string;
  apiKey?: string;
}
const evmAddress = '0xE37cA64A14dD8e92929B7E71f3DA32267Da5969a';
const definitions: Omit<NetworkConfig, 'url'>[] = [
  {
    id: 'btc',
    label: 'BTC · Bitcoin',
    asset: 'BTC',
    decimals: 8,
    address: 'bc1qn63r5d5qd0rnq7l9v2kp75rx9c5jsh9m22v09ru9dy3t3hutt8zqksv2nv',
  },
  {
    id: 'tron',
    label: 'USDT · TRON (TRC20)',
    asset: 'USDT',
    decimals: 6,
    address: 'TLmpR98uorxHmAULuG5JwDpaxKv7j5Zmvq',
    contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
  {
    id: 'eth',
    label: 'USDT · Ethereum (ERC20)',
    asset: 'USDT',
    decimals: 6,
    address: evmAddress,
    contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    chainId: '0x1',
  },
  {
    id: 'bsc',
    label: 'Binance-Peg USDT · BNB Smart Chain (BEP20)',
    asset: 'USDT',
    decimals: 18,
    address: evmAddress,
    contract: '0x55d398326f99059ff775485246999027b3197955',
    chainId: '0x38',
  },
];
export function configuredNetworks(env: NodeJS.ProcessEnv = process.env): NetworkConfig[] {
  if (env.DIRECT_SUPPORT_ENABLED !== 'true') return [];
  return definitions.flatMap((def) => {
    const prefix = `SUPPORT_${def.id.toUpperCase()}`;
    const address = env[`${prefix}_ADDRESS`] ?? def.address;
    const raw = env[`${prefix}_${def.chainId ? 'RPC' : 'API'}_URL`];
    if (!raw || !validAddress(def.id, address)) return [];
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' || url.username || url.password || url.hash) return [];
      return [
        {
          ...def,
          address,
          url: raw.replace(/\/$/, ''),
          ...(def.id === 'tron' && env.SUPPORT_TRON_API_KEY ? { apiKey: env.SUPPORT_TRON_API_KEY } : {}),
        },
      ];
    } catch {
      return [];
    }
  });
}
export function publicNetwork(config: NetworkConfig) {
  const { id, label, asset, address, decimals, contract } = config;
  return { id, label, asset, address, decimals, contract };
}
