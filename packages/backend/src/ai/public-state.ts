import type { TRoomState } from '@avalon/types';

// Historical archives may contain private billing fields; never broadcast them.
export function publicRoomState<T extends TRoomState>(state: T): T {
  if (!state.ai) return state;
  const ai = { ...state.ai };
  delete ai.costRub;
  ai.message = ai.message?.replace(/ · unranked$/, '') || ai.message;
  if (/^Лимит (партии|бюджета)/.test(ai.message || ''))
    ai.message = 'Достигнут лимит расходов. Администратор может проверить бюджет.';
  return { ...state, ai };
}
