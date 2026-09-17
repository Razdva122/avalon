import { store } from '@/store';

export interface SupportInfo {
  enabled: boolean;
  provider: 'oxapay';
  sandbox: boolean;
  thresholdUSD: number;
  donations: {
    id: string;
    amountUSD: number;
    date: string;
    name: string | null;
    userID: string | null;
    avatar: string | null;
  }[];
}
export interface SupportAccount {
  totalUSD: number;
  premium: boolean;
  hideSupport: boolean;
  showPremiumBadge: boolean;
  orders: {
    id: string;
    amountUSD: number;
    status: string;
    sandbox: boolean;
    createdAt: string;
    checkoutUrl?: string;
  }[];
}

export async function supportRequest<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  const base = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  const token = store.state.profile?.token;
  const response = await fetch(`${base}/api/support${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
    cache: 'no-store',
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    if (details.error === 'awaiting_notification') throw new Error('awaitingNotification');
    if (response.status === 401) throw new Error('authError');
    if (response.status === 429) throw new Error('rateError');
    throw new Error(method === 'POST' && path === '/invoice' ? 'invoiceError' : 'error');
  }
  return response.json();
}
