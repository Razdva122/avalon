import type { THistoryMission, THistoryResults, THistoryVote } from '@avalon/types';

interface HistoryGroup {
  kind: 'mission' | 'finale';
  index: number | null;
  entries: THistoryResults[];
  mission?: THistoryMission;
  missionVote?: THistoryVote;
}

/** A completed mission closes the preceding team attempts and addon events. */
export function groupHistory(history: THistoryResults[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let pending: THistoryResults[] = [];
  let nextIndex: number | null = 0;

  const flush = (kind: HistoryGroup['kind'] = 'mission', mission?: THistoryMission) => {
    if (!pending.length) return;
    const lastVote = [...pending].reverse().find((entry): entry is THistoryVote => entry.type === 'vote');
    // A later hidden event could be the actual team vote; keep its mission roster separate.
    const hiddenAfterVote =
      lastVote && pending.slice(pending.lastIndexOf(lastVote) + 1).some((entry) => entry.type === 'hidden');
    const missionVote =
      mission && lastVote && !hiddenAfterVote && (lastVote.forced || lastVote.result === 'approve')
        ? lastVote
        : undefined;
    groups.push({
      kind,
      index: kind === 'finale' ? null : (mission?.index ?? nextIndex),
      entries: pending,
      mission,
      missionVote,
    });
    pending = [];
  };

  for (const entry of history) {
    if (entry.type === 'assassinate') {
      flush();
      pending.push(entry);
      flush('finale');
      continue;
    }
    pending.push(entry);
    if (entry.type === 'mission') {
      flush('mission', entry);
      nextIndex = entry.index + 1;
    }
  }
  flush();
  return groups;
}
