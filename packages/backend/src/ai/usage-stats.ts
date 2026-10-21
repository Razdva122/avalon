import type { CodexWeeklyLimit } from '@avalon/types';

type Window = Pick<CodexWeeklyLimit, 'remainingPercent' | 'resetsAt'>;
export type WeeklyUsagePeriod = { startedAt: number; checkedAt: number; resetsAt: number };

/** Keep the observed window boundary; never infer it by subtracting seven days. */
export function weeklyUsagePeriod(
  previous: WeeklyUsagePeriod | null,
  snapshot: CodexWeeklyLimit | null,
): WeeklyUsagePeriod | null {
  if (
    !snapshot ||
    !snapshot.resetsAt ||
    !Number.isFinite(snapshot.resetsAt) ||
    !Number.isFinite(snapshot.checkedAt) ||
    (previous && snapshot.checkedAt <= previous.checkedAt)
  )
    return previous;
  let startedAt = previous?.startedAt ?? snapshot.checkedAt;
  if (previous && previous.resetsAt !== snapshot.resetsAt) {
    const scheduled = previous.resetsAt * 1000;
    startedAt = scheduled > previous.startedAt && scheduled <= snapshot.checkedAt ? scheduled : snapshot.checkedAt;
  }
  return { startedAt, checkedAt: snapshot.checkedAt, resetsAt: snapshot.resetsAt };
}

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
