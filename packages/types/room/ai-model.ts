import type { AiRoomState } from './index';

/** Display the selected inference model; the provider identifier stays internal to routing. */
export function aiPlayedModel(ai?: Pick<AiRoomState, 'model' | 'codex' | 'playedModel'>): string | undefined {
  return ai?.codex?.model || ai?.playedModel || (ai?.model === 'codex-chatgpt' ? undefined : ai?.model);
}
