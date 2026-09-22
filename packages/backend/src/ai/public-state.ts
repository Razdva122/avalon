import type { TRoomState } from '@avalon/types';

// Shared broadcasts and replay responses must never include billing, even for admins.
// Admins obtain costs through a separately authorized endpoint.
export function publicRoomState<T extends TRoomState>(state: T): T {
  if (!state.ai) return state;
  const ai = { ...state.ai };
  delete ai.costRub;
  if (/^Лимит (партии|бюджета)/.test(ai.message || ''))
    ai.message = 'Достигнут лимит расходов. Администратор может проверить бюджет.';
  return { ...state, ai };
}
