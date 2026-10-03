import type { THistoryResults, VisualGameState, TRoles, TLoyalty } from '@avalon/types';

import last from 'lodash/last';

export function calculateVisualElement(history: THistoryResults[]): { element?: THistoryResults; timeout: number } {
  const lastElement = last(history);

  if (
    lastElement?.type === 'vote' ||
    lastElement?.type === 'preVote' ||
    (lastElement?.type === 'announceLoyalty' && lastElement.announced) ||
    lastElement?.type === 'mission' ||
    lastElement?.type === 'switchLancelots' ||
    lastElement?.type === 'ambush'
  ) {
    return {
      element: lastElement,
      timeout: 10000,
    };
  }

  if (lastElement?.type === 'switchResult' && lastElement.targetID) {
    return {
      element: lastElement,
      timeout: 0,
    };
  }

  return {
    timeout: 0,
  };
}

/** Queue only events received during live play; archives and catchup are baselines. */
export function createLiveEventTracker(initial?: VisualGameState) {
  let uuid = initial?.uuid;
  let length = initial?.history.length ?? 0;
  const pending = new Map<number, THistoryResults>();
  return {
    observe(game: VisualGameState | undefined, mode: 'live' | 'history', reset = false) {
      const nextLength = game?.history.length ?? 0;
      if (reset || mode !== 'live' || game?.uuid !== uuid || nextLength < length || nextLength > length + 1) {
        pending.clear();
      } else if (game && nextLength === length + 1) {
        pending.set(length, game.history[length]);
      }
      uuid = game?.uuid;
      length = nextLength;
    },
    take(index: number) {
      const event = pending.get(index);
      pending.delete(index);
      return event;
    },
  };
}

export function assassinationReveal(game: VisualGameState):
  | {
      role: TRoles;
      targetRole: TRoles;
      selectedID: string;
      targetID: string;
      hit: boolean;
    }
  | undefined {
  const event = last(game.history);
  if (
    game.stage !== 'end' ||
    event?.type !== 'assassinate' ||
    (event.assassinateType !== 'merlin' && event.assassinateType !== 'guinevere') ||
    event.killedIDs.length !== 1
  )
    return;
  const reasons =
    event.assassinateType === 'guinevere' ? ['killGuinevere', 'missGuinevere'] : ['killMerlin', 'missMerlin'];
  if (!reasons.includes(game.result?.reason ?? '')) return;
  const selected = game.players.find((player) => player.id === event.killedIDs[0]);
  const target = game.players.find((player) =>
    event.assassinateType === 'guinevere'
      ? player.role === 'guinevere'
      : player.role === 'merlin' || player.role === 'merlinPure',
  );
  if (!selected || !target || selected.role === 'unknown') return;
  return {
    role: selected.role as TRoles,
    targetRole: target.role as TRoles,
    selectedID: selected.id,
    targetID: target.id,
    hit: event.result === 'hit',
  };
}

export function loyaltyBadge(
  event?: THistoryResults,
): { team: TLoyalty; sourceID: string; targetID: string } | undefined {
  if (event?.type !== 'announceLoyalty' || (event.announced !== 'good' && event.announced !== 'evil')) return;
  return { team: event.announced, sourceID: event.announcerID, targetID: event.targetID };
}
