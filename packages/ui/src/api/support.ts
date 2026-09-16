import { store } from '@/store';

export interface SupportInfo {
  enabled: boolean;
  currencies: string[];
  thresholdUSD: number;
  donations: { id: string; amountUSD: number; date: string; name: string | null }[];
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
    currency: string;
    createdAt: string;
    checkoutUrl?: string;
  }[];
}

export class SupportError extends Error {
  constructor(
    message: string,
    public minimumUSD?: number,
  ) {
    super(message);
  }
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
    if (details.error === 'below_minimum' && Number.isFinite(details.minimumUSD))
      throw new SupportError('minimumError', details.minimumUSD);
    if (details.error === 'awaiting_notification') throw new SupportError('awaitingNotification');
    if (response.status === 401) throw new Error('authError');
    if (response.status === 429) throw new Error('rateError');
    throw new Error(method === 'POST' && path === '/invoice' ? 'invoiceError' : 'error');
  }
  return response.json();
}
