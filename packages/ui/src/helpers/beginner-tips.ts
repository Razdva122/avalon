import type { VisualGameState, AiRoomState } from '@avalon/types';
export function beginnerTip(
  game: VisualGameState,
  ai: AiRoomState | undefined,
  userID: string | undefined,
): string | null {
  const player = game.players.find((p) => p.id === userID);
  if (!ai?.beginner || !player || !userID || !(ai.humanPlayerIDs ?? [ai.humanPlayerID]).includes(userID)) return null;
  if (game.stage === 'end') return 'end';
  if (ai.status !== 'running') return null;
  if (game.stage === 'selectTeam' && ai.waitingForDiscussion) return 'discussion';
  if (game.stage === 'selectTeam' && ai.discussionPending) return 'discussionWait';
  if (game.stage === 'initialization') return 'intro';
  if (game.stage === 'selectTeam') {
    if (game.vote === 4) return player.features.isLeader ? 'fifthLeader' : 'fifthWait';
    if (player.features.isLeader) return 'selectLeader';
    const last = game.history.at(-1);
    if (last?.type === 'mission' && last.result) return last.result === 'fail' ? 'resultFail' : 'resultSuccess';
    return 'selectWait';
  }
  if (game.stage === 'votingForTeam') return player.features.waitForAction ? 'vote' : 'voteWait';
  if (game.stage === 'onMission') {
    if (!player.features.isSent || !player.features.waitForAction) return 'missionWait';
    return player.validMissionsResult?.includes('fail') ? 'missionEvil' : 'missionGood';
  }
  if (game.stage === 'assassinate') return player.features.isAssassin ? 'assassin' : 'assassinWait';
  return null;
}
export function tipsDisabled(preferenceStore: Pick<Storage, 'getItem'>, roomID: string, userID: string): boolean {
  try {
    return preferenceStore.getItem(`avalon:beginner-tips:${roomID}:${userID}`) === 'off';
  } catch {
    return false;
  }
}
export function saveTipsDisabled(
  preferenceStore: Pick<Storage, 'setItem' | 'removeItem'>,
  roomID: string,
  userID: string,
  disabled: boolean,
): void {
  try {
    const key = `avalon:beginner-tips:${roomID}:${userID}`;
    if (disabled) preferenceStore.setItem(key, 'off');
    else preferenceStore.removeItem(key);
  } catch {
    /* Keep this session usable when browser storage is unavailable. */
  }
}
