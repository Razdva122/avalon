// The server draws every Sunday at 15:00 UTC (20:00 UTC+5).
export function nextGiveawayAt(now = new Date()): Date {
  const next = new Date(now);
  next.setUTCHours(15, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + ((7 - next.getUTCDay()) % 7));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export function formatGiveawayTime(value: Date | string, locale: string, timeZone?: string, fullDate = false): string {
  return new Intl.DateTimeFormat(locale, {
    ...(fullDate ? { day: 'numeric', month: 'short', year: 'numeric' } : { weekday: 'long' }),
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
    timeZoneName: 'shortOffset',
  } as Intl.DateTimeFormatOptions).format(new Date(value));
}
