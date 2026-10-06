const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { nextGiveawayAt, formatGiveawayTime } = require('../src/pages/support/giveaway-time.ts');

test('upcoming draw keeps Sunday 15:00 UTC, including the cutoff and year boundary', () => {
  assert.equal(nextGiveawayAt(new Date('2026-10-04T14:59:59Z')).toISOString(), '2026-10-04T15:00:00.000Z');
  assert.equal(nextGiveawayAt(new Date('2026-10-04T15:00:00Z')).toISOString(), '2026-10-11T15:00:00.000Z');
  assert.equal(nextGiveawayAt(new Date('2026-12-31T12:00:00Z')).toISOString(), '2027-01-03T15:00:00.000Z');
});
test('weekly label converts the day and time together, including next-day time zones', () => {
  const at = '2026-10-04T15:00:00Z';
  assert.match(formatGiveawayTime(at, 'en', 'Europe/Moscow'), /Sunday.*18:00.*GMT\+3/);
  assert.match(formatGiveawayTime(at, 'en', 'Asia/Yekaterinburg'), /Sunday.*20:00.*GMT\+5/);
  assert.match(formatGiveawayTime(at, 'en', 'Pacific/Kiritimati'), /Monday.*05:00.*GMT\+14/);
});
test('the displayed time follows daylight saving at the actual draw date', () => {
  assert.match(formatGiveawayTime('2026-10-25T15:00:00Z', 'en', 'America/New_York'), /11:00.*GMT-4/);
  assert.match(formatGiveawayTime('2026-11-01T15:00:00Z', 'en', 'America/New_York'), /10:00.*GMT-5/);
});
test('winner dates use the same local time zone, including date rollover', () => {
  assert.match(formatGiveawayTime('2026-10-04T15:00:00Z', 'ru', 'Europe/Moscow', true), /4 окт.*2026.*18:00.*GMT\+3/);
  assert.match(
    formatGiveawayTime('2026-10-04T15:00:00Z', 'en', 'Pacific/Kiritimati', true),
    /Oct 5, 2026.*05:00.*GMT\+14/,
  );
});
