import type { BotRequest } from './client';
import { bit, bits, EVIL_ROLES, maskOf, parseGame, publicGame, servantVote, standardRules } from './deduction';
import type { ParsedGame } from './deduction';
import { humanSeatNumbers } from './testimony';

const pct = (value: number) => Math.round(value * 100);

// Measured on self-play: where Merlin's sight and the Servant vote differ, bot Merlins under the cover guard vote
// with their sight barely more often than Servants do by chance; free Merlins depart more. Merlin and Percival
// nearly always propose rosters without visible Evil, ordinary Good about three times in four.
// Human seats reason past the Servant rule whatever their role: at the human tables human Merlins followed their
// sight in 75% of such votes and other human Good in 54% (lab/merlin-votes.ts, in the git history), so a human's
// accurate vote is weak evidence. Over 51 logged assassinations bot Merlins approved 15% of the rosters with Evil
// they could see, other bot Good 26%; human Merlins 17%, other human Good 38%. Bot Merlins approved 42% of the
// rosters whose only Evil was Mordred, other bot Good 30%; human seats did so equally often (lab/assassin-eval.ts).
const MERLIN = {
  coveredFollowsSight: 0.3,
  freeFollowsSight: 0.45,
  humanFollowsSight: 0.75,
  ordinaryFollowsSight: 0.33,
  humanOrdinaryFollowsSight: 0.54,
  cleanProposal: 0.95,
  ordinaryCleanProposal: 0.75,
  approvesVisibleEvil: { bot: 0.15, human: 0.17 },
  ordinaryApprovesVisibleEvil: { bot: 0.26, human: 0.38 },
  approvesHiddenMordred: { bot: 0.42, human: 0.6 },
  ordinaryApprovesHiddenMordred: { bot: 0.3, human: 0.6 },
};
const servantVotes = new Map<string, 'approve' | 'reject' | undefined>();

type MerlinCandidate = {
  seat: number;
  merlinChance: number;
  votesWhereSightDifferedFromServant: number;
  ofThoseVotedWithMerlinSight: number;
  approvedTeamsWithVisibleEvil: string;
  proposalsWithoutVisibleEvil: string;
};

/**
 * Merlin likelihood for each Good candidate. Each recorded vote is compared with the vote a Servant in that seat
 * would have cast at the time and with the vote Merlin's sight implies (reject visible Evil, approve otherwise);
 * votes where the two differ carry most evidence. Bot Merlins are forced to the Servant vote by the cover guard
 * before any failure and on early rejections before two failures, so those votes say little. Approving a roster
 * with Evil Merlin sees, or one whose only Evil is Mordred, is weaker evidence counted on every vote.
 */
export function merlinHunt(
  game: ParsedGame,
  humans: number[],
  evil: number,
  mordred: number,
  candidates: number[],
  morgana = 0,
): MerlinCandidate[] {
  const visible = evil & ~mordred;
  const humanMask = maskOf(humans);
  if (servantVotes.size > 20000) servantVotes.clear();
  const score = new Map(candidates.map((seat) => [seat, 0]));
  const notes = new Map(
    candidates.map((seat) => [
      seat,
      { telling: 0, followedSight: 0, cleanProposals: 0, proposals: 0, visibleVotes: 0, visibleApprovals: 0 },
    ]),
  );
  game.proposals.forEach((proposal, index) => {
    const record = publicGame({
      ...game,
      missions: game.missions.slice(0, proposal.mission),
      proposals: game.proposals.slice(0, index),
      announcements: game.announcements.filter((check) => check.afterMissions <= proposal.mission),
    });
    const failures = record.missions.filter((m) => m.fails >= m.failsRequired).length;
    const context = {
      teamSize: bits(proposal.team),
      failsRequired: proposal.failsRequired,
      successesBefore: record.missions.length - failures,
      failuresBefore: failures,
      first: record.missions.length === 0,
    };
    const dirty = (visible & proposal.team) !== 0;
    // Percival who has placed Morgana votes against her as Merlin would, so a vote on a roster whose only visible
    // Evil is Morgana counts half; Oberon is the Evil only Merlin sees. Half weight cut the detector's log loss over
    // 41 logged assassinations from 1.110 to 1.084 and moved game 77's Merlin above the Percival it was shot for.
    const onlyMorgana = dirty && !(visible & ~morgana & proposal.team);
    const hiddenMordred = !dirty && (proposal.team & mordred) !== 0;
    const sight = dirty ? 'reject' : 'approve';
    const key = JSON.stringify([
      game.seats.length,
      record.missions.map((m) => [m.team, m.fails]),
      record.proposals.map((p) => [p.leader, p.team, p.approvals, p.rejections, p.forced]),
      record.announcements,
      proposal.team,
      humans,
    ]);
    for (const seat of candidates) {
      const note = notes.get(seat)!;
      let ratio = 1;
      if (proposal.leader === seat) {
        ratio *= dirty
          ? (1 - MERLIN.cleanProposal) / (1 - MERLIN.ordinaryCleanProposal)
          : MERLIN.cleanProposal / MERLIN.ordinaryCleanProposal;
        note.proposals++;
        if (!dirty) note.cleanProposals++;
      }
      const approved = Boolean(proposal.approvals & bit(seat));
      const human = Boolean(humanMask & bit(seat));
      const kind = human ? 'human' : 'bot';
      const rate = (merlin: number, ordinary: number) => (approved ? merlin / ordinary : (1 - merlin) / (1 - ordinary));
      const before = ratio;
      if (!proposal.forced && (approved || proposal.rejections & bit(seat))) {
        if (dirty) {
          note.visibleVotes++;
          if (approved) note.visibleApprovals++;
          ratio *= rate(MERLIN.approvesVisibleEvil[kind], MERLIN.ordinaryApprovesVisibleEvil[kind]);
        } else if (hiddenMordred)
          ratio *= rate(MERLIN.approvesHiddenMordred[kind], MERLIN.ordinaryApprovesHiddenMordred[kind]);
        const cacheKey = `${key}|${seat}`;
        // A Good Lady holder knows the seat it inspected, so voting against an Evil result is the Servant vote,
        // not Merlin's sight (game 77's assassin shot Percival for acting on its own Lady check).
        const checked = record.announcements.filter((check) => check.by === seat);
        const lady = (evil: boolean) =>
          maskOf(checked.filter((check) => check.announcedEvil === evil).map((check) => check.target));
        if (!servantVotes.has(cacheKey))
          servantVotes.set(
            cacheKey,
            servantVote(
              record,
              { seat, evil: lady(true), good: bit(seat) | lady(false), exactlyOneEvil: [], humans: humanMask },
              proposal.team,
              context,
            ),
          );
        const servant = servantVotes.get(cacheKey);
        if (servant && servant !== sight) {
          const covered =
            !human &&
            (servant === 'approve'
              ? failures === 0
              : proposal.attempt <= 2 && failures < 2 && !(proposal.team & bit(seat)));
          const pMerlin = human
            ? MERLIN.humanFollowsSight
            : covered
              ? MERLIN.coveredFollowsSight
              : MERLIN.freeFollowsSight;
          const pOrdinary = human ? MERLIN.humanOrdinaryFollowsSight : MERLIN.ordinaryFollowsSight;
          const followed = (approved ? 'approve' : 'reject') === sight;
          ratio *= followed ? pMerlin / pOrdinary : (1 - pMerlin) / (1 - pOrdinary);
          note.telling++;
          if (followed) note.followedSight++;
        }
      }
      if (onlyMorgana) ratio = before * Math.sqrt(ratio / before);
      score.set(seat, score.get(seat)! + Math.log(ratio));
    }
  });
  const max = Math.max(...score.values());
  const total = [...score.values()].reduce((sum, value) => sum + Math.exp(value - max), 0);
  return candidates
    .map((seat) => {
      const note = notes.get(seat)!;
      return {
        seat,
        merlinChance: pct(Math.exp(score.get(seat)! - max) / total),
        votesWhereSightDifferedFromServant: note.telling,
        ofThoseVotedWithMerlinSight: note.followedSight,
        approvedTeamsWithVisibleEvil: `${note.visibleApprovals}/${note.visibleVotes}`,
        proposalsWithoutVisibleEvil: `${note.cleanProposals}/${note.proposals}`,
      };
    })
    .sort((a, b) => b.merlinChance - a.merlinChance);
}

/** merlinHunt from an Evil seat at the assassination, where every Evil seat is revealed. */
export function assassinationCandidates(request: BotRequest): MerlinCandidate[] | undefined {
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (state?.stage !== 'assassinate' || !own || !EVIL_ROLES.includes(own.role) || !standardRules(state))
    return undefined;
  const evil = maskOf(state.players.filter((p) => EVIL_ROLES.includes(p.role)).map((p) => p.index));
  const mordred = maskOf(state.players.filter((p) => p.role === 'mordred').map((p) => p.index));
  const morgana = maskOf(state.players.filter((p) => p.role === 'morgana').map((p) => p.index));
  const candidates = request.choices.map(Number).filter((seat) => Number.isInteger(seat));
  return merlinHunt(parseGame(state, request.playerID), humanSeatNumbers(request), evil, mordred, candidates, morgana);
}
