import { largeBotGameAge, largeBotGameWeek, weeklyGameAllowance } from './weekly-large-game';

test('the weekly large game resets at Monday midnight in Yekaterinburg', () => {
  expect(largeBotGameWeek(Date.parse('2026-11-22T18:59:59.999Z')).resetsAt).toBe(
    Date.parse('2026-11-22T19:00:00.000Z'),
  );
  expect(largeBotGameWeek(Date.parse('2026-11-22T19:00:00.000Z')).resetsAt).toBe(
    Date.parse('2026-11-29T19:00:00.000Z'),
  );
});

test.each([
  ['2026-11-08T12:00:00Z', 0],
  ['2026-11-11T11:59:59.999Z', 0],
  ['2026-11-11T12:00:00Z', 1],
  ['2027-05-04T12:00:00Z', 1],
  ['2027-05-04T12:00:00.001Z', 2],
])('weekly allowance for a November 4 account on %s is %i', (now, limit) => {
  expect(largeBotGameAge('2026-11-04T12:00:00Z', Date.parse(now)).limit).toBe(limit);
});

test('a six-month anniversary clamps the day at the end of the month', () => {
  expect(largeBotGameAge('2026-08-31T12:00:00Z', Date.parse('2027-02-28T12:00:00Z')).limit).toBe(1);
  expect(largeBotGameAge('2026-08-31T12:00:00Z', Date.parse('2027-02-28T12:00:01Z')).limit).toBe(2);
});

test('a spent account can unlock its second game before the next weekly reset', () => {
  const now = Date.parse('2026-11-21T09:00:00Z');
  const age = largeBotGameAge('2026-05-22T09:00:00Z', now);
  const { resetsAt } = largeBotGameWeek(now);
  expect(weeklyGameAllowance(age, 1, resetsAt)).toEqual({
    limit: 1,
    remaining: 0,
    resetsAt,
    unlocksAt: Date.parse('2026-11-22T09:00:00.001Z'),
  });
});

test('the calendar anniversary uses the registration date in Yekaterinburg', () => {
  const signedUp = '2026-02-28T22:00:00Z'; // March 1, 03:00 in Yekaterinburg.
  expect(largeBotGameAge(signedUp, Date.parse('2026-08-31T22:00:00Z')).limit).toBe(1);
  expect(largeBotGameAge(signedUp, Date.parse('2026-08-31T22:00:00.001Z')).limit).toBe(2);
});
