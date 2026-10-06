import { nextSunday, WEEK } from './schedule';
test.each([
  ['2026-10-06T10:00:00Z', '2026-10-11T15:00:00.000Z'],
  ['2026-10-11T14:59:59Z', '2026-10-11T15:00:00.000Z'],
  ['2026-10-11T15:00:00Z', '2026-10-18T15:00:00.000Z'],
  ['2026-12-31T20:00:00Z', '2027-01-03T15:00:00.000Z'],
])('next draw strictly after %s', (now, expected) => {
  expect(nextSunday(new Date(now)).toISOString()).toBe(expected);
});
test('weekly advancement stays at local Sunday 20:00 across a year boundary', () => {
  expect(new Date(Date.parse('2026-12-27T15:00:00Z') + WEEK).toISOString()).toBe('2027-01-03T15:00:00.000Z');
});
