import type { ExperimentQuota } from './codex-limits';
import type { CodexWeeklyLimit } from '@avalon/types';

type Entry = {
  _id: string;
  stratum: string;
  mode: string;
  details: object;
  status?: string;
  result?: { winner?: string };
  metrics?: Record<string, number>;
  quotaBefore?: CodexWeeklyLimit | ExperimentQuota | null;
  segments?: { status?: string; quota?: CodexWeeklyLimit | ExperimentQuota | null }[];
};

export function sessionExperimentReport(entries: Entry[]) {
  const groups = new Map<
    string,
    {
      stratum: string;
      mode: string;
      settings: object;
      games: number;
      completed: number;
      paused: number;
      stopped: number;
      incomplete: number;
      goodWins: number;
      evilWins: number;
      pauses: number;
      totals: Record<string, number>;
      weeklyQuota: { comparableGames: number; observedPercentagePoints: number };
      shortQuota: { comparableGames: number; observedPercentagePoints: number };
      bucketQuota: Record<string, { comparableGames: number; observedPercentagePoints: number }>;
    }
  >();
  for (const e of entries) {
    const key = e.stratum + ':' + e.mode;
    let group = groups.get(key);
    if (!group) {
      group = {
        stratum: e.stratum,
        mode: e.mode,
        settings: e.details,
        games: 0,
        completed: 0,
        paused: 0,
        stopped: 0,
        incomplete: 0,
        goodWins: 0,
        evilWins: 0,
        pauses: 0,
        totals: {},
        weeklyQuota: { comparableGames: 0, observedPercentagePoints: 0 },
        shortQuota: { comparableGames: 0, observedPercentagePoints: 0 },
        bucketQuota: {},
      };
      groups.set(key, group);
    }
    group.games++;
    if (e.status === 'finished') group.completed++;
    else if (e.status === 'paused') group.paused++;
    else if (e.status === 'stopped') group.stopped++;
    else group.incomplete++;
    if (e.status === 'finished' && e.result?.winner === 'good') group.goodWins++;
    if (e.status === 'finished' && e.result?.winner === 'evil') group.evilWins++;
    group.pauses += e.segments?.filter((s) => s.status === 'paused').length ?? 0;
    for (const [field, value] of Object.entries(e.metrics ?? {}))
      group.totals[field] = (group.totals[field] ?? 0) + value;
    const initial = e.quotaBefore;
    const final = e.segments?.at(-1)?.quota;
    if (
      ['finished', 'stopped'].includes(e.status ?? '') &&
      initial &&
      final &&
      'buckets' in initial &&
      'buckets' in final
    ) {
      for (const bucket of initial.buckets) {
        const endBucket = final.buckets.find((b) => b.limitId === bucket.limitId);
        for (const window of [bucket.primary, bucket.secondary]) {
          if (!window?.resetsAt) continue;
          const end = [endBucket?.primary, endBucket?.secondary].find(
            (w) => w?.windowDurationMins === window.windowDurationMins,
          );
          if (!end || end.resetsAt !== window.resetsAt || end.usedPercent < window.usedPercent) continue;
          const key = bucket.limitId + ':' + window.windowDurationMins;
          const total = (group.bucketQuota[key] ??= { comparableGames: 0, observedPercentagePoints: 0 });
          total.comparableGames++;
          total.observedPercentagePoints += end.usedPercent - window.usedPercent;
        }
      }
    }
    const unwrap = (q: Entry['quotaBefore']) => (q && 'weekly' in q ? q.weekly : q);
    const before = unwrap(e.quotaBefore);
    const after = unwrap(e.segments?.at(-1)?.quota);
    for (const [start, end, accumulator] of [
      [before, after, group.weeklyQuota],
      [before?.shortTerm, after?.shortTerm, group.shortQuota],
    ] as const) {
      if (
        !['finished', 'stopped'].includes(e.status ?? '') ||
        !start ||
        !end ||
        start.resetsAt === null ||
        start.resetsAt !== end.resetsAt ||
        start.remainingPercent < end.remainingPercent
      )
        continue;
      accumulator.comparableGames++;
      accumulator.observedPercentagePoints += start.remainingPercent - end.remainingPercent;
    }
  }
  const rows = [...groups.values()];
  return {
    games: entries.length,
    readyForInitialReview: rows.some(
      (r) =>
        r.mode === 'standard' &&
        r.completed >= 5 &&
        rows.some((s) => s.stratum === r.stratum && s.mode === 'session-delta' && s.completed >= 5),
    ),
    caveat:
      'Quota percentages are coarse shared-account observations, including other account activity and pauses. Missing/reset windows are excluded. Small samples and win rates do not establish equal playing quality. Token totals exclude unknown usage attempts; incomplete games remain visible.',
    groups: rows,
  };
}
