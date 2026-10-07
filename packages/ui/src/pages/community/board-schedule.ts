import type { BoardDraft } from '@avalon/types/player-board';

export function localWeeklySchedule(
  schedule: Pick<BoardDraft, 'days' | 'startHour' | 'endHour' | 'timeZone'>,
  visitorZone: string,
  now: number,
) {
  const dayMs = 86400000;
  const formatter = (timeZone: string) =>
    new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  const source = formatter(schedule.timeZone);
  const visitor = formatter(visitorZone);
  // A UTC timestamp representing the calendar fields, not an instant in that zone.
  const wallTime = (instant: number, format: Intl.DateTimeFormat) => {
    const parts = Object.fromEntries(format.formatToParts(instant).map(({ type, value }) => [type, value]));
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  };
  const sourceNow = new Date(wallTime(now, source));
  const monday =
    Date.UTC(sourceNow.getUTCFullYear(), sourceNow.getUTCMonth(), sourceNow.getUTCDate()) -
    ((sourceNow.getUTCDay() + 6) % 7) * dayMs;
  const instantFor = (wall: number) => {
    // Sample both sides of a transition so each occurrence uses its own DST offset.
    const candidates = [-dayMs, 0, dayMs].map((delta) => {
      const sample = wall + delta;
      return wall - (wallTime(sample, source) - sample);
    });
    const matching = candidates.filter((instant) => wallTime(instant, source) === wall);
    // Repeated hour: first occurrence. Skipped hour: move forward by the DST gap.
    return matching.length ? Math.min(...matching) : Math.max(...candidates);
  };
  const localFields = (instant: number) => {
    const date = new Date(wallTime(instant, visitor));
    return {
      day: ((date.getUTCDay() + 6) % 7) + 1,
      time: `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`,
    };
  };
  return {
    referenceDate: new Date(monday).toISOString().slice(0, 10),
    slots: [...schedule.days]
      .sort((a, b) => a - b)
      .map((day) => {
        const start = localFields(instantFor(monday + (day - 1) * dayMs + schedule.startHour * 3600000));
        const end = localFields(
          instantFor(
            monday + (day - 1 + (schedule.endHour < schedule.startHour ? 1 : 0)) * dayMs + schedule.endHour * 3600000,
          ),
        );
        return { startDay: start.day, endDay: end.day, startTime: start.time, endTime: end.time };
      }),
  };
}
