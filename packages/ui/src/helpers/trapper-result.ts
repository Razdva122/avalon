import type { VisualGameState, DiscardMissionCard } from '@avalon/types';

export function privateTrapperCard(
  game?: Pick<VisualGameState, 'uuid' | 'stage' | 'history'>,
  viewerID?: string,
): { key: string; event: DiscardMissionCard } | undefined {
  if (!game || !viewerID || game.stage === 'end') return;
  for (let index = game.history.length - 1; index >= 0; index--) {
    const event = game.history[index];
    if (event.type === 'discardMissionCard' && event.leaderID === viewerID && event.result) {
      return { key: `${game.uuid}:${index}`, event };
    }
  }
}
