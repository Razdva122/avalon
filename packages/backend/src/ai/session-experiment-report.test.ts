import { sessionExperimentReport } from './session-experiment-report';

test('quota resets and unavailable observations are excluded from estimated percentage consumption', () => {
  const quota = (remainingPercent: number, resetsAt: number) => ({ remainingPercent, resetsAt, checkedAt: 1 });
  const row = {
    _id: 'one',
    stratum: 'same',
    mode: 'standard',
    details: {},
    status: 'finished',
    metrics: { uncachedTokens: 100, outputTokens: 5 },
    quotaBefore: quota(80, 100),
    segments: [{ quota: quota(78, 100) }],
  };
  const report = sessionExperimentReport([
    row,
    { ...row, _id: 'two', mode: 'session-delta', segments: [{ quota: quota(99, 200) }] },
    { ...row, _id: 'three', status: 'paused', quotaBefore: null },
  ]);
  expect(report.groups[0].weeklyQuota).toEqual({ comparableGames: 1, observedPercentagePoints: 2 });
  expect(report.groups[1].weeklyQuota.comparableGames).toBe(0);
  expect(report.groups[0].completed).toBe(1);
  expect(report.groups[0].paused).toBe(1);
  expect(report.readyForInitialReview).toBe(false);
});
