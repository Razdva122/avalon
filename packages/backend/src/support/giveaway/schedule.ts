export const WEEK = 7 * 86400000;
// Yekaterinburg is UTC+5: Sunday 20:00 is Sunday 15:00 UTC.
export function nextSunday(now: Date): Date {
  const next = new Date(now);
  next.setUTCHours(15, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + ((7 - next.getUTCDay()) % 7));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}
