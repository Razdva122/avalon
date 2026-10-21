import { quotaSpent } from './usage-stats';

test('quota consumption uses percentage points only within the same known reset window', () => {
  expect(quotaSpent({ remainingPercent: 80, resetsAt: 100 }, { remainingPercent: 77.5, resetsAt: 100 })).toBe(2.5);
  expect(quotaSpent({ remainingPercent: 80, resetsAt: 100 }, { remainingPercent: 80, resetsAt: 100 })).toBe(0);
  expect(quotaSpent({ remainingPercent: 1, resetsAt: 100 }, { remainingPercent: 99, resetsAt: 200 })).toBeNull();
  expect(quotaSpent({ remainingPercent: 80, resetsAt: null }, { remainingPercent: 70, resetsAt: null })).toBeNull();
  expect(quotaSpent({ remainingPercent: 70, resetsAt: 100 }, { remainingPercent: 80, resetsAt: 100 })).toBeNull();
  expect(quotaSpent(null, { remainingPercent: 70, resetsAt: 100 })).toBeNull();
});
