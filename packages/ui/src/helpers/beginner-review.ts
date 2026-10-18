import type { AiRoomState, VisualGameState } from '@avalon/types';

/** Uses only the outcome and public mission results, never hindsight about secret cards. */
export function beginnerReview(game: VisualGameState, ai: AiRoomState | undefined, userID?: string) {
  const player = game.players.find((p) => p.id === userID);
  if (
    !ai?.beginner ||
    !userID ||
    !player ||
    game.stage !== 'end' ||
    !(ai.humanPlayerIDs ?? [ai.humanPlayerID]).includes(userID)
  )
    return null;
  const role = player.role;
  if (!game.result?.winner || game.result.reason === 'manualy') return { kind: 'unfinished', role, tip: null } as const;
  if (game.result.reason === 'killMerlin' || game.result.reason === 'missMerlin')
    return {
      kind: game.result.reason,
      role,
      tip:
        role === 'merlin'
          ? 'merlin'
          : ['mordred', 'morgana', 'minion', 'oberon'].includes(role)
            ? 'assassin'
            : 'compare',
    } as const;
  const failed = game.history.find((entry) => entry.type === 'mission' && !entry.hidden && entry.result === 'fail');
  if (failed?.type === 'mission')
    return { kind: 'failedMission', role, tip: 'compare', mission: failed.index + 1 } as const;
  return { kind: 'general', role, tip: 'compare' } as const;
}
