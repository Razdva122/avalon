const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { localWeeklySchedule } = require('../src/pages/community/board-schedule.ts');
const base = { days: [1], startHour: 0, endHour: 2, timeZone: 'UTC' };
const now = Date.parse('2026-10-07T12:00:00Z');

test('moves a Monday interval to Sunday in the visitor timezone', () => {
  assert.deepEqual(localWeeklySchedule(base, 'America/Los_Angeles', now), {
    referenceDate: '2026-10-05',
    slots: [{ startDay: 7, endDay: 7, startTime: '17:00', endTime: '19:00' }],
  });
});
test('keeps fractional-hour offsets and the shifted end weekday', () => {
  assert.deepEqual(localWeeklySchedule({ ...base, startHour: 18, endHour: 20 }, 'Asia/Kolkata', now).slots, [
    { startDay: 1, endDay: 2, startTime: '23:30', endTime: '01:30' },
  ]);
  assert.deepEqual(localWeeklySchedule(base, 'Asia/Kathmandu', now).slots, [
    { startDay: 1, endDay: 1, startTime: '05:45', endTime: '07:45' },
  ]);
});
test('converts an overnight interval from source wall times', () => {
  assert.deepEqual(
    localWeeklySchedule({ ...base, days: [7], startHour: 23, endHour: 2, timeZone: 'Asia/Tokyo' }, 'UTC', now).slots,
    [{ startDay: 7, endDay: 7, startTime: '14:00', endTime: '17:00' }],
  );
});
test('uses the DST offset of each occurrence rather than the current offset', () => {
  const schedule = { ...base, days: [1, 7], startHour: 18, endHour: 20, timeZone: 'Europe/London' };
  assert.deepEqual(localWeeklySchedule(schedule, 'UTC', Date.parse('2026-10-21T12:00:00Z')), {
    referenceDate: '2026-10-19',
    slots: [
      { startDay: 1, endDay: 1, startTime: '17:00', endTime: '19:00' },
      { startDay: 7, endDay: 7, startTime: '18:00', endTime: '20:00' },
    ],
  });
});
test('converts source overnight endpoints independently across a DST change', () => {
  assert.deepEqual(
    localWeeklySchedule(
      { ...base, days: [6], startHour: 23, endHour: 3, timeZone: 'Europe/London' },
      'UTC',
      Date.parse('2026-10-21T12:00:00Z'),
    ).slots,
    [{ startDay: 6, endDay: 7, startTime: '22:00', endTime: '03:00' }],
  );
});
test('uses source-zone calendar week at a UTC date boundary', () => {
  assert.equal(
    localWeeklySchedule({ ...base, timeZone: 'Pacific/Auckland' }, 'UTC', Date.parse('2026-10-04T12:00:00Z'))
      .referenceDate,
    '2026-10-05',
  );
});
test('handles skipped and repeated source hours consistently with compatible disambiguation', () => {
  assert.deepEqual(
    localWeeklySchedule(
      { ...base, days: [7], startHour: 2, endHour: 4, timeZone: 'America/New_York' },
      'UTC',
      Date.parse('2026-03-04T12:00:00Z'),
    ).slots,
    [{ startDay: 7, endDay: 7, startTime: '07:00', endTime: '08:00' }],
  );
  assert.deepEqual(
    localWeeklySchedule(
      { ...base, days: [7], startHour: 1, endHour: 3, timeZone: 'America/New_York' },
      'UTC',
      Date.parse('2026-10-28T12:00:00Z'),
    ).slots,
    [{ startDay: 7, endDay: 7, startTime: '05:00', endTime: '08:00' }],
  );
});
