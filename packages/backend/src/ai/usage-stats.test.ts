import { quotaSpent, weeklyUsagePeriod } from './usage-stats';

test('weekly periods follow observed reset-date changes, including early resets, without calendar arithmetic', () => {
  const snapshot = { remainingPercent: 40, resetsAt: 9000, checkedAt: 1000 };
  const initial = weeklyUsagePeriod(null, snapshot)!;
  expect(initial.startedAt).toBe(1000);
  expect(weeklyUsagePeriod(initial, { ...snapshot, checkedAt: 2000 })?.startedAt).toBe(1000);
  const early = weeklyUsagePeriod(initial, { ...snapshot, resetsAt: 10000, checkedAt: 3000 })!;
  expect(early.startedAt).toBe(3000);
  expect(weeklyUsagePeriod(early, { ...snapshot, checkedAt: 2000 })).toEqual(early);
  expect(weeklyUsagePeriod(early, null)).toEqual(early);
  expect(weeklyUsagePeriod(early, { ...snapshot, resetsAt: null, checkedAt: 4000 })).toEqual(early);
  expect(weeklyUsagePeriod(early, { ...snapshot, resetsAt: 20000, checkedAt: 10001000 })?.startedAt).toBe(10000000);
  const delayed = weeklyUsagePeriod(initial, { ...snapshot, checkedAt: 9001000 })!;
  expect(weeklyUsagePeriod(delayed, { ...snapshot, resetsAt: 20000, checkedAt: 9002000 })?.startedAt).toBe(9000000);
});

test('quota consumption uses percentage points only within the same known reset window', () => {
  expect(quotaSpent({ remainingPercent: 80, resetsAt: 100 }, { remainingPercent: 77.5, resetsAt: 100 })).toBe(2.5);
  expect(quotaSpent({ remainingPercent: 80, resetsAt: 100 }, { remainingPercent: 80, resetsAt: 100 })).toBe(0);
  expect(quotaSpent({ remainingPercent: 1, resetsAt: 100 }, { remainingPercent: 99, resetsAt: 200 })).toBeNull();
  expect(quotaSpent({ remainingPercent: 80, resetsAt: null }, { remainingPercent: 70, resetsAt: null })).toBeNull();
  expect(quotaSpent({ remainingPercent: 70, resetsAt: 100 }, { remainingPercent: 80, resetsAt: 100 })).toBeNull();
  expect(quotaSpent(null, { remainingPercent: 70, resetsAt: 100 })).toBeNull();
});
