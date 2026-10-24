import type { VisualGameState } from '@avalon/types';

// Exact alignment bookkeeping for one observer. Every possible Evil seat set is enumerated (at most C(8,3)=56),
// filtered by authoritative facts and weighted by typical behaviour, so the model no longer does the arithmetic.

export const EVIL_ROLES = [
  'evil',
  'mordred',
  'morgana',
  'minion',
  'oberon',
  'evilLancelot',
  'trickster',
  'lunatic',
  'brute',
  'witch',
  'revealer',
];

// Behaviour model. Values are deliberately moderate: they rank hypotheses, they do not prove anything.
// Mission-1 rates follow ProAvalon/Nakamura data: Evil rarely fails a two-seat opener but usually fails a larger one.
const FAIL_PROPENSITY = {
  failWinsNow: 0.96,
  goodAtTwo: 0.9,
  firstPair: 0.15,
  firstMission: 0.6,
  // Cover Successes are common before Evil needs the points; self-play showed 0.75 over-cleared Morgana.
  normal: 0.65,
  pointlessOnTwoFail: 0.25,
  pairOnTwoFail: 0.75,
};
const DOUBLE_FAIL = 0.3;
// Players approve rosters they are on regardless of side, so off-team votes carry most of the signal. Good players
// rarely approve a roster without themselves unless the record clears it for them, and Evil approves agreeable
// clean openers more readily than later clean rosters. Fitted on self-play logs; humans are less consistent,
// so their off-team votes count for less.
const VOTE = {
  onTeamEvil: 0.96,
  onTeamGood: 0.85,
  offTeamEvilWithAlly: 0.72,
  offTeamEvilClean: 0.3,
  offTeamEvilCleanFirst: 0.65,
  offTeamGood: 0.07,
  offTeamGoodFirst: 0.2,
  offTeamGoodHuman: 0.3,
  offTeamGoodHumanFirst: 0.5,
  offTeamGoodCleared: 0.85,
};
// Merlin votes from sight. Used only where a world fixes Merlin's seat (Percival's wizard pair); measured on
// self-play Merlins, with "dirty" meaning any Evil on the roster.
const MERLIN_VOTE = {
  onTeamClean: 0.95,
  onTeamDirty: 0.45,
  offTeamClean: 0.25,
  offTeamCleanFirst: 0.1,
  offTeamDirty: 0.05,
};
const HUMAN_GOOD_TRUTHFUL = 0.92;

export type MissionContext = {
  failsRequired: number;
  successesBefore: number;
  failuresBefore: number;
  first: boolean;
  teamSize?: number;
};

type Mission = {
  index: number;
  team: number;
  fails: number;
  failsRequired: number;
  successesBefore: number;
  failuresBefore: number;
  cards: Map<number, 'success' | 'fail'>;
};
type Proposal = {
  mission: number;
  attempt: number;
  leader: number;
  team: number;
  forced: boolean;
  approvals: number;
  rejections: number;
  failsRequired: number;
  result: 'approve' | 'reject';
};
type Announcement = {
  by: number;
  target: number;
  announcedEvil: boolean;
  actualEvil?: boolean;
  afterMissions: number;
};

export type ParsedGame = {
  seats: number[];
  evilCount: number;
  missions: Mission[];
  proposals: Proposal[];
  announcements: Announcement[];
};

export type Knowledge = {
  seat?: number;
  evil: number;
  good: number;
  // Each group contains exactly one Evil seat (Percival's Merlin/Morgana pair).
  exactlyOneEvil: number[];
  humans: number;
};

export const bit = (seat: number) => 1 << seat;
export const bits = (mask: number) => {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
};
export const maskOf = (seats: readonly number[]) => seats.reduce((mask, seat) => mask | bit(seat), 0);
export const seatsOf = (mask: number) => {
  const seats: number[] = [];
  for (let seat = 0; seat < 31; seat++) if (mask & bit(seat)) seats.push(seat);
  return seats;
};
export const label = (mask: number) => seatsOf(mask).join(', ');
const STANDARD_ROLES = ['merlin', 'percival', 'servant', 'mordred', 'morgana', 'oberon', 'minion'];
const STANDARD_ADDONS = ['assassin', 'ladyOfLake'];

/** Lancelots, Trickster, Excalibur and similar variants change the rules this engine assumes. */
export function standardRules(state: VisualGameState) {
  const roles = [...(state.settings?.roles?.good || []), ...(state.settings?.roles?.evil || [])];
  return (
    roles.length > 0 &&
    roles.every((role) => STANDARD_ROLES.includes(role)) &&
    Object.keys(state.addonsData || {}).every((addon) => STANDARD_ADDONS.includes(addon))
  );
}

const isEvilRole = (role: string | undefined) => EVIL_ROLES.includes(role || '');
const isAnnouncedEvil = (value: unknown) => typeof value === 'string' && (value === 'evil' || isEvilRole(value));

export function parseGame(state: VisualGameState, observerID?: string): ParsedGame {
  const players = state.players || [];
  const seat = new Map(players.map((p) => [p.id, p.index]));
  const seats = players.map((p) => p.index).sort((a, b) => a - b);
  const evilCount =
    state.settings?.players?.evil ?? (seats.length >= 7 ? 3 : 2); /* standard lineup when settings are absent */
  const missions: Mission[] = [];
  const proposals: Proposal[] = [];
  const announcements: Announcement[] = [];
  let attempt = 0;
  for (const event of state.history || []) {
    const score = {
      successes: missions.filter((m) => m.fails < m.failsRequired).length,
      failures: missions.filter((m) => m.fails >= m.failsRequired).length,
    };
    if (event.type === 'vote') {
      const votes = Array.isArray(event.votes) ? event.votes : [];
      proposals.push({
        mission: missions.length,
        attempt: attempt++,
        leader: seat.get(event.leaderID) ?? 0,
        team: maskOf(event.team.map((member) => seat.get(member.id) ?? 0)),
        forced: Boolean(event.forced),
        approvals: maskOf(votes.filter((v) => v.value === 'approve').map((v) => seat.get(v.playerID) ?? 0)),
        rejections: maskOf(votes.filter((v) => v.value === 'reject').map((v) => seat.get(v.playerID) ?? 0)),
        failsRequired: state.settings?.missions[missions.length]?.failsRequired ?? 1,
        result: event.result,
      });
    } else if (event.type === 'mission' && event.result) {
      const cards = new Map<number, 'success' | 'fail'>();
      for (const action of event.actions)
        if ('value' in action && action.value && action.playerID === observerID)
          cards.set(seat.get(action.playerID) ?? 0, action.value as 'success' | 'fail');
      missions.push({
        index: event.index,
        team: maskOf(event.actions.map((action) => seat.get(action.playerID) ?? 0)),
        fails: event.fails ?? 0,
        failsRequired: event.settings?.failsRequired ?? state.settings?.missions[event.index]?.failsRequired ?? 1,
        successesBefore: score.successes,
        failuresBefore: score.failures,
        cards,
      });
      attempt = 0;
    } else if (event.type === 'announceLoyalty') {
      announcements.push({
        by: seat.get(event.announcerID) ?? 0,
        target: seat.get(event.targetID) ?? 0,
        announcedEvil: isAnnouncedEvil(event.announced),
        actualEvil:
          event.actual === undefined || event.announcerID !== observerID ? undefined : isAnnouncedEvil(event.actual),
        afterMissions: missions.length,
      });
    }
  }
  return { seats, evilCount, missions, proposals, announcements };
}

export function observerKnowledge(state: VisualGameState, observerID: string, humanSeats: number[]): Knowledge {
  const players = state.players || [];
  const own = players.find((p) => p.id === observerID);
  const morgana = (state.settings?.roles?.evil || []).includes('morgana');
  let evil = 0;
  let good = 0;
  const wizards: number[] = [];
  for (const player of players) {
    if (player.role === 'unknown') continue;
    if (player.role === 'mysteryWizard') wizards.push(player.index);
    else if (isEvilRole(player.role)) evil |= bit(player.index);
    else good |= bit(player.index);
  }
  if (own && !isEvilRole(own.role)) good |= bit(own.index);
  const exactlyOneEvil: number[] = [];
  if (wizards.length === 2 && morgana) exactlyOneEvil.push(maskOf(wizards));
  else good |= maskOf(wizards);
  return { seat: own?.index, evil, good, exactlyOneEvil, humans: maskOf(humanSeats) };
}

/** What a Servant in the observer's seat would know: own alignment and own cards, no role sight. */
export function servantKnowledge(knowledge: Knowledge): Knowledge {
  return {
    seat: knowledge.seat,
    evil: 0,
    good: knowledge.seat === undefined ? 0 : bit(knowledge.seat),
    exactlyOneEvil: [],
    humans: knowledge.humans,
  };
}

/** The same records without anything only this observer can see. */
export function publicGame(game: ParsedGame): ParsedGame {
  return {
    ...game,
    missions: game.missions.map((mission) => ({ ...mission, cards: new Map() })),
    announcements: game.announcements.map((check) => ({ ...check, actualEvil: undefined })),
  };
}

export function publicKnowledge(humanSeats: number[]): Knowledge {
  return { evil: 0, good: 0, exactlyOneEvil: [], humans: maskOf(humanSeats) };
}

export function combinations(seats: number[], size: number): number[] {
  if (size === 0) return [0];
  if (seats.length < size) return [];
  const [first, ...rest] = seats;
  return [...combinations(rest, size - 1).map((mask) => mask | bit(first)), ...combinations(rest, size)];
}

function binomial(n: number, k: number, p: number) {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c * p ** k * (1 - p) ** (n - k);
}

/** Probability of exactly `fails` Fail cards from `evil` unseen Evil participants. */
function failDistribution(evil: number, fails: number, context: MissionContext) {
  if (fails < 0 || fails > evil) return 0;
  if (evil === 0) return fails === 0 ? 1 : 0;
  if (context.failsRequired >= 2) {
    if (evil === 1) return binomial(1, fails, FAIL_PROPENSITY.pointlessOnTwoFail);
    // A pair fails a decisive two-Fail mission as surely as anyone fails a decisive one-Fail mission.
    const pair =
      context.failuresBefore >= 2
        ? FAIL_PROPENSITY.failWinsNow
        : context.successesBefore >= 2
          ? FAIL_PROPENSITY.goodAtTwo
          : FAIL_PROPENSITY.pairOnTwoFail;
    return binomial(evil, fails, pair);
  }
  const p =
    context.failuresBefore >= 2
      ? FAIL_PROPENSITY.failWinsNow
      : context.successesBefore >= 2
        ? FAIL_PROPENSITY.goodAtTwo
        : context.first
          ? (context.teamSize ?? 3) <= 2
            ? FAIL_PROPENSITY.firstPair
            : FAIL_PROPENSITY.firstMission
          : FAIL_PROPENSITY.normal;
  const none = (1 - p) ** evil;
  if (fails === 0) return none;
  const some = 1 - none;
  if (evil === 1) return some;
  // Evil usually avoids redundant Fails on a one-Fail mission.
  if (fails === 1) return some * (1 - DOUBLE_FAIL);
  if (evil === 2) return fails === 2 ? some * DOUBLE_FAIL : 0;
  return fails === 2 ? some * DOUBLE_FAIL * 0.8 : fails === 3 ? some * DOUBLE_FAIL * 0.2 : 0;
}

/** Chance that a roster fails when it contains `evil` Evil players, in the current score context. */
export function missionFailChance(evil: number, context: MissionContext) {
  let total = 0;
  for (let fails = context.failsRequired; fails <= evil; fails++) total += failDistribution(evil, fails, context);
  return total;
}

type World = { evil: number; weight: number };

/** Per proposal, the seats for which the roster was provably unfailable from public missions plus their own Good seat. */
function clearedVoters(game: ParsedGame) {
  const all = combinations(game.seats, game.evilCount);
  return game.proposals.map((proposal) => {
    const possible = all.filter((evil) =>
      game.missions.slice(0, proposal.mission).every((mission) => bits(evil & mission.team) >= mission.fails),
    );
    let cleared = 0;
    for (const seat of game.seats)
      if (possible.every((evil) => evil & bit(seat) || bits(evil & proposal.team) < proposal.failsRequired))
        cleared |= bit(seat);
    return cleared;
  });
}

export function worlds(game: ParsedGame, knowledge: Knowledge, options: { behaviour?: boolean } = {}): World[] {
  const behaviour = options.behaviour !== false;
  const cleared = behaviour ? clearedVoters(game) : [];
  const result: World[] = [];
  for (const evil of combinations(game.seats, game.evilCount)) {
    if ((evil & knowledge.evil) !== knowledge.evil || evil & knowledge.good) continue;
    if (knowledge.exactlyOneEvil.some((group) => bits(evil & group) !== 1)) continue;
    let weight = 1;
    for (const mission of game.missions) {
      let knownFails = 0;
      let unseen = mission.team;
      for (const [seat, card] of mission.cards) {
        unseen &= ~bit(seat);
        if (card === 'fail') knownFails++;
      }
      const unseenEvil = bits(evil & unseen);
      const fails = mission.fails - knownFails;
      if (fails < 0 || fails > unseenEvil) {
        weight = 0;
        break;
      }
      if (behaviour)
        weight *= failDistribution(unseenEvil, fails, {
          failsRequired: mission.failsRequired,
          successesBefore: mission.successesBefore,
          failuresBefore: mission.failuresBefore,
          first: mission.successesBefore + mission.failuresBefore === 0,
          teamSize: bits(mission.team),
        });
    }
    if (!weight) continue;
    for (const check of game.announcements) {
      const targetEvil = Boolean(evil & bit(check.target));
      if (check.actualEvil !== undefined && check.actualEvil !== targetEvil) weight = 0;
      else if (!(evil & bit(check.by))) {
        // Good bots must announce truthfully at this table; Good humans usually do.
        if (!(knowledge.humans & bit(check.by))) {
          if (check.announcedEvil !== targetEvil) weight = 0;
        } else if (behaviour)
          weight *= check.announcedEvil === targetEvil ? HUMAN_GOOD_TRUTHFUL : 1 - HUMAN_GOOD_TRUTHFUL;
      }
      if (!weight) break;
    }
    if (!weight) continue;
    if (behaviour) {
      const merlin = knowledge.exactlyOneEvil.reduce((mask, group) => mask | (group & ~evil), 0);
      for (const [index, proposal] of game.proposals.entries()) {
        if (proposal.forced) continue;
        const dirty = (evil & proposal.team) !== 0;
        for (const seat of game.seats) {
          if (seat === knowledge.seat) continue;
          const approved = Boolean(proposal.approvals & bit(seat));
          if (!approved && !(proposal.rejections & bit(seat))) continue;
          const onTeam = Boolean(proposal.team & bit(seat));
          const first = proposal.mission === 0;
          const pApprove =
            merlin & bit(seat)
              ? onTeam
                ? dirty
                  ? MERLIN_VOTE.onTeamDirty
                  : MERLIN_VOTE.onTeamClean
                : dirty
                  ? MERLIN_VOTE.offTeamDirty
                  : first
                    ? MERLIN_VOTE.offTeamCleanFirst
                    : MERLIN_VOTE.offTeamClean
              : onTeam
                ? evil & bit(seat)
                  ? VOTE.onTeamEvil
                  : VOTE.onTeamGood
                : evil & bit(seat)
                  ? dirty
                    ? VOTE.offTeamEvilWithAlly
                    : first
                      ? VOTE.offTeamEvilCleanFirst
                      : VOTE.offTeamEvilClean
                  : cleared[index] & bit(seat)
                    ? VOTE.offTeamGoodCleared
                    : knowledge.humans & bit(seat)
                      ? first
                        ? VOTE.offTeamGoodHumanFirst
                        : VOTE.offTeamGoodHuman
                      : first
                        ? VOTE.offTeamGoodFirst
                        : VOTE.offTeamGood;
          weight *= approved ? pApprove : 1 - pApprove;
        }
      }
    }
    result.push({ evil, weight });
  }
  const total = result.reduce((sum, world) => sum + world.weight, 0);
  return total > 0 ? result.map((world) => ({ ...world, weight: world.weight / total })) : [];
}

/**
 * The vote a Servant in `knowledge.seat` would cast on `team` from these records: approve its own near-best team,
 * reject teams it is not on unless they are as safe as any. Matches observed Good-bot voting.
 */
export function servantVote(
  game: ParsedGame,
  knowledge: Knowledge,
  team: number,
  context: MissionContext,
  offTeamMargin = 0.01,
) {
  const view = worlds(game, knowledge);
  if (!view.length || knowledge.seat === undefined) return undefined;
  const risk = teamRisk(view, team, context).fail;
  // Before any mission there is nothing to choose between rosters but one's own seat, and the opener nearly always
  // passes (25 of 28 in the latest agent-played rounds): rejecting it off-team only delays the game and read as a
  // Good voting block to testers (Good bots rejected 25 of 38 openers). Approve it unless it likely fails.
  if (context.first && risk < 0.5) return 'approve';
  const best = Math.min(
    ...combinations(game.seats, context.teamSize ?? bits(team)).map((mask) => teamRisk(view, mask, context).fail),
  );
  return risk <= best + (team & bit(knowledge.seat) ? 0.1 : offTeamMargin) ? 'approve' : 'reject';
}

export function evilProbability(all: World[], seat: number) {
  return all.reduce((sum, world) => sum + (world.evil & bit(seat) ? world.weight : 0), 0);
}

export function teamRisk(all: World[], team: number, context: MissionContext) {
  let fail = 0;
  let capable = 0;
  for (const world of all) {
    const evil = bits(world.evil & team);
    if (evil >= context.failsRequired) capable += world.weight;
    fail += world.weight * missionFailChance(evil, context);
  }
  return { fail, capable };
}
