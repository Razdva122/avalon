import type { WeeklyLargeBotGame } from '@avalon/types';
import { AiPause } from './client';

const dayMs = 24 * 60 * 60 * 1000;
const yekaterinburgOffsetMs = 5 * 60 * 60 * 1000;

export function largeBotGameWeek(now = Date.now()) {
  // Yekaterinburg uses UTC+05:00 year-round.
  const local = new Date(now + yekaterinburgOffsetMs);
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const startsAt =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysSinceMonday) - yekaterinburgOffsetMs;
  return { startsAt, resetsAt: startsAt + 7 * dayMs };
}

export function largeBotGameAge(registrationDate: string | undefined, now = Date.now()) {
  const registered = new Date(registrationDate ?? '');
  const time = registered.getTime();
  // Older profiles without a registration timestamp keep the standard allowance.
  if (!Number.isFinite(time)) return { limit: 1 };
  const unlocksAt = time + 7 * dayMs;
  if (now < unlocksAt) return { limit: 0, nextTierAt: unlocksAt };

  const local = new Date(time + yekaterinburgOffsetMs);
  const anniversary = new Date(local);
  anniversary.setUTCMonth(anniversary.getUTCMonth() + 6, 1);
  const lastDay = new Date(anniversary);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  anniversary.setUTCDate(Math.min(local.getUTCDate(), lastDay.getUTCDate()));
  const veteranAt = anniversary.getTime() - yekaterinburgOffsetMs + 1;
  return now < veteranAt ? { limit: 1, nextTierAt: veteranAt } : { limit: 2 };
}

export function weeklyGameAllowance(
  age: ReturnType<typeof largeBotGameAge>,
  used: number,
  resetsAt: number,
): WeeklyLargeBotGame {
  const remaining = Math.max(0, age.limit - used);
  const unlocksAt =
    age.limit === 0 || (remaining === 0 && used < 2 && (age.nextTierAt ?? Infinity) < resetsAt)
      ? age.nextTierAt
      : undefined;
  return { limit: age.limit, remaining, resetsAt, ...(unlocksAt !== undefined && { unlocksAt }) };
}

export class WeeklyLargeGameUsed extends AiPause {
  constructor(readonly allowance: WeeklyLargeBotGame) {
    super('weeklyLargeGameUsed');
  }
}
