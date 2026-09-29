import { store } from '@/store';
import { boardError } from '@/pages/community/board-helpers';

export async function boardRequest<T>(path = '', method = 'GET', body?: unknown): Promise<T> {
  const base = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  const token = store.state.profile?.token;
  const response = await fetch(`${base}/api/player-boards${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(boardError(details.error));
  }
  return response.json();
}
