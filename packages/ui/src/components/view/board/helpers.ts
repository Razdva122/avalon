import type { THistoryResults, VisualGameState, TRoles, TLoyalty, TVisibleRole } from '@avalon/types';

import last from 'lodash/last';

/** Only a live lobby-to-game transition is a deal, never an initial room snapshot. */
export function shouldDealRoles(
  room: { stage: string; game?: { stage: string; players: { id: string; role: TVisibleRole }[] } },
  previousStage: string | undefined,
  viewerID: string | undefined,
  mode: 'live' | 'history',
): boolean {
  if (!['created', 'locked'].includes(previousStage ?? '') || room.stage !== 'started' || mode !== 'live') return false;
  if (!viewerID || !room.game || room.game.stage === 'end') return false;
  const player = room.game.players.find((seat) => seat.id === viewerID);
  return Boolean(player && !['unknown', 'good', 'evil'].includes(player.role));
}

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

  if (lastElement?.type === 'switchResult') {
    return {
      element: lastElement,
      timeout: lastElement.targetID ? 3000 : 2000,
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
    observe(game: VisualGameState | undefined, mode: 'live' | 'history', reset = false, allowLiveBatch = false) {
      const nextLength = game?.history.length ?? 0;
      if (
        reset ||
        mode !== 'live' ||
        game?.uuid !== uuid ||
        nextLength < length ||
        (nextLength > length + 1 && !allowLiveBatch)
      ) {
        pending.clear();
      } else if (game && nextLength > length) {
        // Witch can append its declaration and mission in the same live update.
        for (let index = length; index < nextLength; index++) pending.set(index, game.history[index]);
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

export type AssassinationCard = { id: string; role: TRoles; hit: boolean };

export function assassinationReveal(game: VisualGameState):
  | {
      role: TRoles;
      targetRole: TRoles;
      selectedID: string;
      targetID: string;
      hit: boolean;
      variant?: 'cut' | 'verdict';
      cards?: AssassinationCard[];
      pending?: boolean;
    }
  | undefined {
  const event = last(game.history);
  if (event?.type === 'assassinate' && (event.assassinateType === 'lovers' || event.assassinateType === 'cleric')) {
    const cleric = event.assassinateType === 'cleric';
    const pending =
      cleric &&
      game.stage === 'assassinate' &&
      event.result === 'hit' &&
      game.addonsData?.assassin?.progressData?.type === 'cleric' &&
      game.addonsData.assassin.progressData.stage === 1;
    const reasons = cleric ? ['killCleric', 'missCleric'] : ['killLovers', 'missLovers'];
    if (!pending && (game.stage !== 'end' || !reasons.includes(game.result?.reason ?? ''))) return;
    if (event.killedIDs.length !== (cleric ? 1 : 2) || new Set(event.killedIDs).size !== event.killedIDs.length) return;
    const previous = game.history[game.history.length - 2];
    const events =
      !pending &&
      cleric &&
      previous?.type === 'assassinate' &&
      previous.assassinateType === 'cleric' &&
      previous.result === 'hit' &&
      previous.assassinID === event.assassinID &&
      previous.killedIDs.length === 1
        ? [previous, event]
        : [event];
    const cards: AssassinationCard[] = [];
    for (const attack of events) {
      for (const id of attack.killedIDs) {
        const player = game.players.find((player) => player.id === id);
        // Never use private roles: the live first Cleric card must already be public.
        if (!player || player.role === 'unknown' || (pending && player.role !== 'cleric')) return;
        cards.push({ id, role: player.role as TRoles, hit: attack.result === 'hit' });
      }
    }
    return {
      role: cards[0].role,
      targetRole: cards[0].role,
      selectedID: cards[0].id,
      targetID: cards[0].id,
      hit: event.result === 'hit',
      variant: cleric ? 'verdict' : 'cut',
      cards,
      pending: Boolean(pending),
    };
  }
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

/** Anonymous public totals only; individual mission votes never enter the scene. */
export function missionReveal(event?: THistoryResults) {
  if (!event || event.type !== 'mission') return;
  const players = event.settings.players;
  if (!Number.isInteger(players) || players < 1 || players > 5) return;
  if (event.hidden) return { index: event.index, players, hidden: true as const };
  if (event.fails === undefined || !event.result) return;
  if (!Number.isInteger(event.fails) || event.fails < 0 || event.fails > players) return;
  return { index: event.index, players, fails: event.fails, result: event.result };
}

export function excaliburReveal(event?: THistoryResults) {
  if (event?.type !== 'switchResult' || !event.switcherID) return;
  return { sourceID: event.switcherID, targetID: event.targetID };
}

/** Fit only the card fan between live labels; the result emerges below it. */
export function missionSceneLayout(width: number, voteBottom: number, footerTop: number) {
  const scale = Math.min(1, Math.max(1, footerTop - voteBottom - 24) / 138);
  return { left: (width - 360 * scale) / 2, top: voteBottom + 12 - 60 * scale, scale };
}
