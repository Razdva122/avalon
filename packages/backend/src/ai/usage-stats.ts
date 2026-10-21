import type { CodexWeeklyLimit } from '@avalon/types';

type Window = Pick<CodexWeeklyLimit, 'remainingPercent' | 'resetsAt'>;
/** A changed/unknown reset or an increased balance cannot be attributed to this game. */
export function quotaSpent(before?: Window | null, after?: Window | null): number | null {
  if (
    !before ||
    !after ||
    !before.resetsAt ||
    before.resetsAt !== after.resetsAt ||
    !Number.isFinite(before.remainingPercent) ||
    !Number.isFinite(after.remainingPercent) ||
    before.remainingPercent < after.remainingPercent
  )
    return null;
  return Math.round((before.remainingPercent - after.remainingPercent) * 10000) / 10000;
}
