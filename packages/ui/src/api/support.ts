import { store } from '@/store';
import { supportError } from '@/pages/support/checkout';
export interface SupportNetwork {
  id: 'btc' | 'tron' | 'eth' | 'bsc';
  label: string;
  asset: 'BTC' | 'USDT';
  address: string;
  decimals: number;
  contract?: string;
}
export interface SupportInfo {
  enabled: boolean;
  provider: 'direct';
  thresholdUSD: number;
  networks: SupportNetwork[];
  donations: {
    id: string;
    amountUSD: number;
    date: string;
    name: string | null;
    userID: string | null;
    avatar: string | null;
  }[];
}
export interface SupportPayment {
  id: string;
  amountUSD: number;
  status: string;
  createdAt: string;
  network?: SupportNetwork['id'];
  txid?: string;
  address?: string;
  asset: string;
  amountCrypto?: string;
}
export interface SupportAccount {
  totalUSD: number;
  premium: boolean;
  hideSupport: boolean;
  showPremiumBadge: boolean;
  orders: SupportPayment[];
}
export async function supportRequest<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  const base = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  const token = store.state.profile?.token;
  const response = await fetch(`${base}/api/support${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
    cache: 'no-store',
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(supportError(response.status, details.error));
  }
  return response.json();
}
