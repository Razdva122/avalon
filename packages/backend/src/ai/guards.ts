import type { BotRequest } from './client';
import {
  bit,
  bits,
  combinations,
  EVIL_ROLES,
  evilProbability,
  label,
  maskOf,
  observerKnowledge,
  parseGame,
  publicGame,
  publicKnowledge,
  seatsOf,
  servantKnowledge,
  servantVote,
  standardRules,
  teamRisk,
  worlds,
} from './deduction';
import { assassinationCandidates } from './merlin';
import { humanSeatNumbers } from './testimony';

// Overrides only for strictly dominated actions; every genuine strategic tradeoff stays with the model.
export type Guard = { choice: string; reason: string };

const parseTeam = (choice: string) =>
  /^\d(\s*,\s*\d)*$/.test(choice) ? maskOf(choice.split(',').map((seat) => Number(seat.trim()))) : undefined;

const guardsEnabled = () => process.env.AI_DECISION_GUARDS !== 'off';
// Good seats' silent votes come from the deduction engine, not a model call (see decisionPipeline).
export const codeVotesEnabled = () => process.env.AI_CODE_VOTES !== 'off' && guardsEnabled();

/** The vote a Servant in this seat would cast from public records and its own cards (see servantVote). */
export function servantLikeVote(request: BotRequest): 'approve' | 'reject' | undefined {
  return seatVote(request, false);
}

/** The Servant rule applied with everything this Good seat knows, including Merlin's or Percival's sight. */
export function codeVote(request: BotRequest): 'approve' | 'reject' | undefined {
  return seatVote(request, true);
}

function seatVote(request: BotRequest, sight: boolean): 'approve' | 'reject' | undefined {
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (!own || !state.settings || state.stage !== 'votingForTeam' || !standardRules(state)) return undefined;
  const humans = humanSeatNumbers(request);
  const game = parseGame(state, request.playerID);
  const failures = game.missions.filter((m) => m.fails >= m.failsRequired).length;
  const context = {
    teamSize: state.settings.missions[state.mission]?.players,
    failsRequired: state.settings.missions[state.mission]?.failsRequired ?? 1,
    successesBefore: game.missions.length - failures,
    failuresBefore: failures,
    first: game.missions.length === 0,
  };
  const team = maskOf(state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index));
  const knowledge = observerKnowledge(state, request.playerID, humans);
  // A Good seat's own vote approves an off-team roster within 5 points of the best: over 494 logged off-team Good
  // votes that was right 82% of the time in hindsight, against 79% for the Servant model's 1 point.
  const seen = sight ? knowledge : servantKnowledge(knowledge);
  const vote = servantVote(game, seen, team, context, sight ? 0.05 : 0.01);
  // Rejecting the fourth proposal hands the forced fifth roster to the next leader. When the record makes that
  // leader Evil, their roster fails about as surely as Evil likes, so any safer roster is the better bet. In the
  // logs this changed 9 Good votes, every time with an Evil fifth leader: 5 rosters were clean, 4 would have
  // failed like the forced one (Good handed Oberon the hammer this way in game 74).
  if (vote !== 'reject' || state.vote !== 3) return vote;
  const seats = [...state.players].sort((a, b) => a.index - b.index);
  const fifth = seats[(seats.findIndex((p) => p.features.isLeader) + 1) % seats.length].index;
  const view = worlds(game, seen);
  const evil = evilProbability(view, fifth);
  if (fifth === own.index || evil < 0.75) return vote;
  const size = context.teamSize ?? bits(team);
  const best = Math.min(
    ...combinations(game.seats, size)
      .filter((mask) => mask & bit(fifth))
      .map((mask) => teamRisk(view, mask, context).fail),
  );
  return teamRisk(view, team, context).fail <= evil * 0.8 + (1 - evil) * best ? 'approve' : vote;
}

/**
 * A shot at a seat the Merlin detector rates under a third of its top candidate goes to that candidate: over the
 * logged assassinations such shots never hit, and switching them hit Merlin five times. The detector mistakes sharp
 * human Servants for Merlin, so the shot never moves onto a human seat; and since bot Merlins now vote like Servants
 * it is often unsure, so closer calls stay with the model, whose reading of the chat sometimes beats it.
 */
function assassinGuard(request: BotRequest, choice: string): Guard | undefined {
  const ranked = assassinationCandidates(request);
  const top = ranked?.[0];
  const picked = ranked?.find((candidate) => String(candidate.seat) === choice.trim());
  const target = request.choices.find((option) => Number(option) === top?.seat);
  if (!top || !picked || !target || picked.seat === top.seat || picked.merlinChance * 3 >= top.merlinChance)
    return undefined;
  if (humanSeatNumbers(request).includes(top.seat)) return undefined;
  return {
    choice: target,
    reason: `Votes and proposals make ${top.seat} (${top.merlinChance}%) far more Merlin-like than ${picked.seat} (${picked.merlinChance}%); shots that far below the top candidate have missed.`,
  };
}

/**
 * Table convention for Evil seats that see each other: when more of them are on a mission than its Fails need, the
 * lowest-numbered play Fail and the rest Success, so allies never burn themselves with a redundant Fail. Seat 1 led
 * first and the lead passes upward, so this is order from the first leader.
 */
export function conventionSaboteurs(team: number, knownEvil: number, failsRequired: number) {
  return seatsOf(team & knownEvil).slice(0, failsRequired);
}

/** Allies this Evil seat knows that the public record already rates at least 75% Evil (or proves Evil). */
export function exposedAllies(request: BotRequest): number[] | undefined {
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (!own || !EVIL_ROLES.includes(own.role) || !state.settings || !standardRules(state)) return undefined;
  const humans = humanSeatNumbers(request);
  const knowledge = observerKnowledge(state, request.playerID, humans);
  const allies = seatsOf(knowledge.evil & ~bit(own.index));
  if (!allies.length) return [];
  const game = publicGame(parseGame(state, request.playerID));
  const pub = worlds(game, publicKnowledge(humans));
  const pubHard = worlds(game, publicKnowledge(humans), { behaviour: false });
  if (!pub.length) return [];
  return allies.filter((seat) => evilProbability(pub, seat) >= 0.75 || evilProbability(pubHard, seat) > 0.9999);
}

export function guardDecision(request: BotRequest, choice: string): Guard | undefined {
  if (!guardsEnabled()) return undefined;
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (!own || !state.settings || request.publicDiscussion || request.councilDiscussion || !standardRules(state))
    return undefined;
  if (state.stage === 'assassinate') return assassinGuard(request, choice);
  // An Evil result on a seat this Evil player could not see is an ally. Merlin already sees Morgana, the Minion and
  // Oberon as Evil, so calling the ally Good costs them nothing there and keeps the ally on teams; agent testers saw
  // Morgana burn Oberon this way in three Codex games despite the hint. Mordred's trade-off differs and stays open.
  // An ally the table already all but knows is Evil gains nothing from a Good claim, which only pairs the holder with
  // them. In between the trade-off is the model's: testers read a Good claim on a 79% suspect as an Evil pair (game
  // 77) and the true result on a 70% suspect as burning Mordred (game 81, both testers).
  if (state.stage === 'announceLoyalty') {
    const target = state.players.find((p) => p.features.isSelected);
    const checkedEvil = request.privateCheck === 'evil' || EVIL_ROLES.includes(request.privateCheck || '');
    if (!EVIL_ROLES.includes(own.role) || !checkedEvil || target?.role !== 'unknown') return undefined;
    const pub = worlds(publicGame(parseGame(state, request.playerID)), publicKnowledge(humanSeatNumbers(request)));
    const suspicion = pub.length ? evilProbability(pub, target.index) : 0;
    if (suspicion >= 0.5 && suspicion < 0.9) return undefined;
    if (suspicion >= 0.9)
      return choice === 'good' && request.choices.includes('evil')
        ? {
            choice: 'evil',
            reason:
              'The table already reads this ally as Evil; vouching for them only ties you to them, while the true result earns you trust.',
          }
        : undefined;
    if (own.role !== 'mordred' && choice === 'evil' && request.choices.includes('good'))
      return {
        choice: 'good',
        reason:
          'This Evil result is an ally you could not see. Merlin already sees you as Evil, so calling them Good costs nothing and keeps them on teams.',
      };
    return undefined;
  }
  if (!['votingForTeam', 'selectTeam', 'onMission', 'checkLoyalty'].includes(state.stage)) return undefined;
  const humans = humanSeatNumbers(request);
  const game = parseGame(state, request.playerID);
  const knowledge = observerKnowledge(state, request.playerID, humans);
  const mine = worlds(game, knowledge);
  const hard = worlds(game, knowledge, { behaviour: false });
  const pub = worlds(publicGame(game), publicKnowledge(humans));
  if (!mine.length || !hard.length || !pub.length) return undefined;
  const evil = EVIL_ROLES.includes(own.role);
  const failures = game.missions.filter((m) => m.fails >= m.failsRequired).length;
  const successes = game.missions.length - failures;
  const context = {
    teamSize: state.settings.missions[state.mission]?.players,
    failsRequired: state.settings.missions[state.mission]?.failsRequired ?? 1,
    successesBefore: successes,
    failuresBefore: failures,
    first: game.missions.length === 0,
  };
  const r = context.failsRequired;
  const team = maskOf(state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index));
  const unseenEvil = (mask: number) => Math.max(...hard.map((world) => bits(world.evil & mask & ~knowledge.evil)));
  const legal = (state.stage === 'selectTeam' ? request.choices.map(parseTeam) : [])
    .filter((mask): mask is number => mask !== undefined)
    .map((mask) => ({
      mask,
      ...teamRisk(mine, mask, context),
      proven: teamRisk(hard, mask, context).capable,
      publicFail: teamRisk(pub, mask, context).fail,
      knownEvil: bits(mask & knowledge.evil),
    }));
  const overlap = (a: number, b: number) => bits(a & b);

  // Inspecting a known ally leaves Evil only bad announcements: burn the ally, or a lie Merlin sees through. Strong
  // players inspect a Good seat instead; the most suspected one makes the check look like a real question.
  if (state.stage === 'checkLoyalty') {
    const target = Number(choice);
    if (!evil || !(knowledge.evil & bit(target))) return undefined;
    const others = request.choices.map(Number).filter((seat) => seat && !(knowledge.evil & bit(seat)));
    if (!others.length) return undefined;
    const best = others.sort((a, b) => evilProbability(pub, b) - evilProbability(pub, a))[0];
    return {
      choice: String(best),
      reason: `Inspecting ${target}, a known ally, leaves only burning them or a lie Merlin sees through; inspect ${best} instead.`,
    };
  }

  if (state.stage === 'onMission' && evil && request.choices.includes('fail') && request.choices.includes('success')) {
    const capable = bits(team & knowledge.evil) + unseenEvil(team) >= r;
    if (!capable)
      return choice === 'fail'
        ? {
            choice: 'success',
            reason: 'Too few Evil on this team to reach the Fail threshold; a Fail only exposes you.',
          }
        : undefined;
    if (failures >= 2 && choice !== 'fail')
      return { choice: 'fail', reason: 'A failed mission wins the game for Evil now.' };
    // A Fail that ends the game exposes nobody, so the convention only governs the others. The server plays only
    // bot cards: a human saboteur may not follow the convention, so with one designated the choice stays open.
    const saboteurs = conventionSaboteurs(team, knowledge.evil, r);
    if (
      failures < 2 &&
      bits(team & knowledge.evil) > r &&
      !saboteurs.includes(own.index) &&
      !(maskOf(saboteurs) & knowledge.humans)
    )
      return choice === 'fail'
        ? {
            choice: 'success',
            reason: `By the table convention ${label(maskOf(saboteurs))} play${saboteurs.length > 1 ? '' : 's'} the Fail here; a second Fail would only expose you.`,
          }
        : undefined;
    if (successes >= 2 && choice !== 'fail')
      return { choice: 'fail', reason: 'A success gives Good its third mission; this is the last chance to sabotage.' };
    // Oberon sees no ally. Where the record puts another Evil on a one-Fail roster above the 60% a three-seat roster
    // starts at, that ally fails it under the table convention anyway, so Oberon's Fail is redundant and a double
    // Fail exposes both: in the logs such rosters held another Evil in 3 of 4 cases, and Oberon failed them all.
    if (own.role === 'oberon' && choice === 'fail' && r === 1 && failures < 2 && successes < 2) {
      const ally = mine.reduce((sum, world) => sum + (world.evil & team & ~bit(own.index) ? world.weight : 0), 0);
      if (ally > 0.6)
        return {
          choice: 'success',
          reason: `Another Evil is about ${Math.round(ally * 100)}% likely on this team and would fail it; a second Fail only exposes you both.`,
        };
    }
    // The other seat on a two-player first mission would know exactly who failed it. Strong players almost never
    // take that point, and the Good model expects the pass (FAIL_PROPENSITY.firstPair).
    if (context.first && bits(team) === 2 && choice === 'fail')
      return {
        choice: 'success',
        reason: 'A Fail on a two-player first mission tells your partner exactly who failed; pass it for cover.',
      };
    return undefined;
  }

  if (state.stage === 'votingForTeam' && (choice === 'approve' || choice === 'reject')) {
    const risk = teamRisk(mine, team, context);
    const proven = teamRisk(hard, team, context).capable;
    if (evil) {
      if (failures >= 2 && bits(team & knowledge.evil) >= r && choice === 'reject')
        return { choice: 'approve', reason: 'This team has enough Evil to fail and a failure wins the game now.' };
      // A leader voting down its own proposal is a tell (agent testers caught Mordred doing it twice in game 55);
      // only a roster too clean to fail at two Good successes is worth rejecting.
      const ownProposal = state.players.some((p) => p.index === own.index && p.features.isLeader);
      if (ownProposal && choice === 'reject' && !(successes >= 2 && bits(team & knowledge.evil) < r))
        return { choice: 'approve', reason: 'You proposed this team; voting it down marks you.' };
      // At two Good successes a rejected clean-looking roster costs Evil nothing, and its success ends the missions.
      if (successes >= 2 && bits(team & knowledge.evil) < r && choice === 'approve')
        return {
          choice: 'reject',
          reason: 'Too few known Evil on this team to fail it, and its success would give Good the third mission.',
        };
      // Approving a roster with an ally the table already reads as Evil only ties the voter to them: Good players vote
      // it down. At match point the mission matters more than cover.
      const burned = maskOf(exposedAllies(request) || []);
      if (
        choice === 'approve' &&
        team & burned &&
        failures < 2 &&
        successes < 2 &&
        state.vote < 4 &&
        servantLikeVote(request) === 'reject'
      )
        return {
          choice: 'reject',
          reason: `The table already reads ${label(team & burned)} as Evil; approving this roster marks you as their ally, and Good players will vote it down anyway.`,
        };
      // Approving a team you are not on is the classic Evil tell: at the human tables Good players did it in about 20%
      // of their votes after mission 1, Evil bots in 40%. Without enough known Evil on it to fail, the approval gains
      // nothing, so vote as a Servant in this seat would. Mission 1 has no such pattern (Good bots approved 24%,
      // human Good players every time), and forced rejections there made the Evil seats a visible block. A leader
      // who sat out of its own roster still backs it (Mordred voted down its own clean team in game 74).
      if (
        !context.first &&
        !ownProposal &&
        choice === 'approve' &&
        !(team & bit(own.index)) &&
        bits(team & knowledge.evil) < r &&
        servantLikeVote(request) === 'reject'
      )
        return {
          choice: 'reject',
          reason:
            'Approving a team you are not on is the classic Evil tell, and too few allies you know of are on it to fail it; vote as a Servant in this seat would.',
        };
      // Away from match point, rejecting a roster too clean to fail that a Servant would approve only marks the
      // voter: at the human tables it changed the result once in 16 tries. Backing a failable ally roster stays with
      // the model: predicting the others' votes from the Servant rule once rejected a roster an Evil approval would
      // have passed (agent-played game 55).
      const servant = servantLikeVote(request);
      const leads = state.players.some((p) => p.index === own.index && p.features.isLeader);
      if (
        servant === 'approve' &&
        choice === 'reject' &&
        bits(team & knowledge.evil) < r &&
        failures < 2 &&
        successes < 2 &&
        state.vote < 4 &&
        !leads
      )
        return {
          choice: 'approve',
          reason:
            'A Servant in your seat would approve this roster and too few allies you know of are on it to fail it; a lone rejection only marks you.',
        };
      return undefined;
    }
    // The vote follows the proposal at once, so a Good leader voting down a team its own estimate rates as good as
    // the best wastes the proposal and reads as confusion or Evil (leaders rejected their own team in 29 of 323
    // logged votes, wrongly 14 times in 20 for Good). A team it rated clearly worse may still be rejected.
    if (choice === 'reject' && state.players.find((p) => p.features.isLeader)?.index === own.index && proven < 0.9999) {
      const size = state.settings.missions[state.mission]?.players ?? 0;
      const best = Math.min(...combinations(game.seats, size).map((mask) => teamRisk(mine, mask, context).fail));
      if (risk.fail <= best + 0.05)
        return {
          choice: 'approve',
          reason: 'You proposed this team; voting it down wastes the proposal and looks Evil.',
        };
    }
    // Merlin's proofs are secret: forcing perfectly accurate approvals would hand the assassin a pattern.
    // A leader voting against their own proposal is a glaring tell, so Merlin's own roster is exempt.
    const leadsVote = state.players.some((p) => p.index === own.index && p.features.isLeader);
    if (own.role === 'merlin' && failures < 2 && !leadsVote) {
      // Rejecting like a Servant only delays a clean roster, so it stays cheap until the fourth proposal;
      // approving a roster Merlin knows is dirty is only worth the secrecy before any failure.
      const cover = servantLikeVote(request);
      const cheap = cover === 'reject' ? state.vote <= 2 && !(team & bit(own.index)) : failures === 0;
      return cover && cover !== choice && cheap
        ? { choice: cover, reason: 'Merlin cover: vote as a Servant in this seat would.' }
        : undefined;
    }
    if (proven < 0.0001 && choice === 'reject' && own.role !== 'merlin')
      return { choice: 'approve', reason: 'Every consistent assignment makes this team unable to fail.' };
    if (proven > 0.9999 && choice === 'approve' && (failures >= 2 || own.role !== 'merlin'))
      return { choice: 'reject', reason: 'This team provably contains enough Evil to fail it.' };
    if (choice === 'approve' && failures >= 2 && state.vote <= 2 && risk.fail >= 0.5) {
      const size = state.settings.missions[state.mission]?.players ?? 0;
      const best = Math.min(...combinations(game.seats, size).map((mask) => teamRisk(mine, mask, context).fail));
      if (best <= risk.fail - 0.3)
        return {
          choice: 'reject',
          reason: `A failure loses the game; this team fails about ${Math.round(risk.fail * 100)}% of the time while a legal team near ${Math.round(best * 100)}% exists and more proposals remain.`,
        };
    }
    return undefined;
  }

  if (state.stage === 'selectTeam') {
    // Legal rosters are written in seat order from the leader ("6, 1, 2"), so a guard answers with that exact text;
    // a sorted label never matched them and the substitution was silently skipped.
    const legalText = (mask: number) => request.choices.find((option) => parseTeam(option) === mask) ?? label(mask);
    const chosen = legal.find((row) => label(row.mask) === label(parseTeam(choice) ?? 0));
    // A leader always goes on their own team: a Good leader knows one member for certain, and a leader who sits
    // out reads as Evil at once (Good leaders went on 29 of 30 human-table picks).
    const withMe = legal.filter((row) => row.mask & bit(own.index));
    if (!chosen || !withMe.length) return undefined;
    const pick = (rows: typeof legal, key: (row: (typeof legal)[number]) => number) =>
      [...rows].sort(
        (a, b) =>
          key(a) - key(b) || overlap(b.mask, chosen.mask) - overlap(a.mask, chosen.mask) || a.publicFail - b.publicFail,
      )[0];
    const swaps = withMe.filter((row) => overlap(row.mask, chosen.mask) === bits(chosen.mask) - 1);
    const sitsOut = !(chosen.mask & bit(own.index));
    const offTeam = (row: (typeof legal)[number]) =>
      `A leader always goes on their own team, and one who leaves themselves off ${label(chosen.mask)} looks Evil; ${label(row.mask)} puts you on it instead.`;
    if (evil) {
      const sabotage = withMe.filter((row) => row.knownEvil >= r);
      const best = sabotage.length ? pick(sabotage, (row) => row.publicFail) : undefined;
      if (best && (failures >= 2 || successes >= 2) && chosen.knownEvil < r)
        return {
          choice: legalText(best.mask),
          reason: `This mission decides the game; ${label(chosen.mask)} lacks enough Evil to fail, ${label(best.mask)} has it.`,
        };
      // A roster that can fail but looks far guiltier than another that can also fail invites a rejection and marks
      // its members (human-table logs: Mordred sent a 63% roster when a 15% one held the same Fails).
      const guilty = (row: (typeof legal)[number]) =>
        Boolean(best) && row.knownEvil >= r && row.publicFail - best!.publicFail >= 0.25;
      if (guilty(chosen))
        return {
          choice: legalText(best!.mask),
          reason: `To the table ${label(chosen.mask)} looks about ${Math.round(chosen.publicFail * 100)}% likely to fail; ${label(best!.mask)} can fail just as well and looks about ${Math.round(best!.publicFail * 100)}%.`,
        };
      // Re-proposing a roster the table voted down this mission was rejected again in all six logged cases and only
      // shows the leader pushing it; the automatic fifth proposal is the exception.
      const rejectedBefore = game.proposals.some(
        (proposal) =>
          proposal.mission === state.mission &&
          proposal.team === chosen.mask &&
          bits(proposal.rejections) > bits(proposal.approvals),
      );
      if (rejectedBefore && state.vote < 4) {
        const fresh = withMe.filter(
          (row) =>
            row.mask !== chosen.mask &&
            !game.proposals.some((proposal) => proposal.mission === state.mission && proposal.team === row.mask),
        );
        const swap =
          pick(
            fresh.filter((row) => chosen.knownEvil < r || row.knownEvil >= r),
            (row) => row.publicFail,
          ) ?? pick(fresh, (row) => row.publicFail);
        if (swap)
          return {
            choice: legalText(swap.mask),
            reason: `The table already voted ${label(chosen.mask)} down this mission; proposing it again only shows you pushing it. ${label(swap.mask)} is a fresh roster.`,
          };
      }
      // A roster with an ally the table already reads as Evil is voted down and ties its leader to them; only the
      // automatic fifth proposal still gets through.
      const burned = maskOf(exposedAllies(request) || []);
      if (burned && chosen.mask & burned && state.vote < 4 && failures < 2) {
        const clean = withMe.filter((row) => !(row.mask & burned));
        const swap =
          pick(
            clean.filter((row) => chosen.knownEvil < r || row.knownEvil >= r),
            (row) => row.publicFail,
          ) ?? pick(clean, (row) => row.publicFail);
        if (swap)
          return {
            choice: legalText(swap.mask),
            reason: `The table already reads ${label(chosen.mask & burned)} as Evil, so ${label(chosen.mask)} will be voted down and marks you as their ally; ${label(swap.mask)} leaves them off.`,
          };
      }
      // Sitting out only looks Evil to a table that does not already read the leader as Evil; a caught leader's own
      // seat gets the roster voted down (Oberon kept proposing itself after being flagged in the Codex round).
      const caught = evilProbability(pub, own.index) >= 0.75;
      if (sitsOut && !caught) {
        // Swap in for one member, keeping the roster able to fail if it was and as unsuspicious as possible.
        const swap =
          pick(
            swaps.filter((row) => (chosen.knownEvil < r || row.knownEvil >= r) && !guilty(row)),
            (row) => row.publicFail,
          ) ?? pick(withMe, (row) => row.publicFail);
        return { choice: legalText(swap.mask), reason: offTeam(swap) };
      }
      return undefined;
    }
    const best = pick(withMe, (row) => row.fail);
    // Sitting out is fixed by swapping in for the member that adds the most risk, unless that roster is still bad.
    const mine = sitsOut ? (pick(swaps, (row) => row.fail) ?? best) : chosen;
    if (mine.proven > 0.9999 && best.proven < 0.9999)
      return {
        choice: legalText(best.mask),
        reason: `${label(chosen.mask)} provably contains enough Evil to fail; ${label(best.mask)} does not.`,
      };
    // A leader's own vote rejects a roster more than 10 points riskier than the best (servantVote's on-team margin),
    // and a leader voting down its own pick is a glaring tell (game 68), so the pick follows the same line. Over the
    // logged games the engine's roster was clean more often than the bot's from a 5-point gap (14 of 17 against 10)
    // and far more from 30 points (20 of 23 against 6).
    // Merlin's best roster comes from its sight, so holding it to 10 points forces perfect rosters, the pattern the
    // assassin hunts (game 53 of the Codex round): until a failure would lose, Merlin keeps the old 45-point leeway.
    const leeway = own.role === 'merlin' && failures < 2 ? 0.45 : 0.1;
    if (mine.fail - best.fail > leeway)
      return {
        choice: legalText(best.mask),
        reason: `${label(chosen.mask)} fails about ${Math.round(chosen.fail * 100)}% of the time; ${label(best.mask)} about ${Math.round(best.fail * 100)}%.`,
      };
    if (sitsOut) return { choice: legalText(mine.mask), reason: offTeam(mine) };
  }
  return undefined;
}

/**
 * Seats Merlin names in public that it sees as Evil while the public record gives a Servant no reason to doubt
 * them: the assassin's council looks for exactly this. Votes are covered by the guard above; speech is not.
 * At two failures a failed mission loses the game outright, so, as for votes, Merlin may spend its sight.
 */
export function merlinSpeechExposure(request: BotRequest, text: string) {
  if (!guardsEnabled() || !text.trim()) return undefined;
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (own?.role !== 'merlin' || !state.settings || !standardRules(state)) return undefined;
  const humans = humanSeatNumbers(request);
  const knowledge = observerKnowledge(state, request.playerID, humans);
  const game = parseGame(state, request.playerID);
  if (game.missions.filter((m) => m.fails >= m.failsRequired).length >= 2) return undefined;
  const pub = worlds(publicGame(game), publicKnowledge(humans));
  if (!pub.length) return undefined;
  const named = new Set((text.match(/(?<!\d)(?<!\d[.,])\d(?!\d)(?![.,]\d)/g) || []).map(Number));
  const seats = [...named].filter(
    (seat) =>
      knowledge.evil & bit(seat) &&
      pub.reduce((sum, world) => sum + (world.evil & bit(seat) ? world.weight : 0), 0) < 0.5,
  );
  return seats.length ? seats : undefined;
}

// Five-word runs with at least two content words; seat lists and filler alone do not count as copying.
const FILLER = new Set(
  'that this with from have they them their there been were what when then than will would should could just your about into after again also only'.split(
    ' ',
  ),
);
function phrases(text: string) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  const runs = new Set<string>();
  for (let i = 0; i + 5 <= words.length; i++) {
    const run = words.slice(i, i + 5);
    if (run.filter((word) => /^\d+$/.test(word)).length > 1) continue;
    if (run.filter((word) => word.length >= 4 && !FILLER.has(word)).length < 2) continue;
    runs.add(run.join(' '));
  }
  return runs;
}

/** A five-word run of the public text already said in the last ten chat lines: players read copied lines as a bot. */
export function echoedPhrase(request: BotRequest, text: string) {
  const recent = new Set(request.chat.slice(-10).flatMap((message) => [...phrases(message.text)]));
  return [...phrases(text)].find((run) => recent.has(run));
}

// Words a game cannot be discussed without; a worn-out phrase needs at least one word outside them.
const GAME_WORDS = new Set(
  [
    'mission missions team teams roster rosters fail fails failed failing success successes successful pass passed',
    'vote votes voted approve approved reject rejected lady merlin percival morgana mordred oberon evil good proposal',
    'proposals leader seat seats card cards result results round player players played first second third fourth',
    'fifth final last next double single both record council target inspected inspect announce announces announced',
    'checked check need needs',
  ]
    .join(' ')
    .split(' '),
);
const STOPWORDS = new Set(
  'the and but for not are was you all can our out one two has had his her its who why how yes now see say said lets let'.split(
    ' ',
  ),
);

function wordPairs(text: string) {
  const pairs = new Set<string>();
  // Pairs stay inside one stretch of words: punctuation and seat numbers break them.
  for (const fragment of text.toLowerCase().split(/[.!?;:,()\d]+/)) {
    const words = (fragment.match(/[\p{L}']+/gu) || []).filter(
      (word) => word.length >= 4 && !FILLER.has(word) && !STOPWORDS.has(word),
    );
    for (let i = 0; i + 1 < words.length; i++)
      if (!GAME_WORDS.has(words[i]) || !GAME_WORDS.has(words[i + 1])) pairs.add(`${words[i]} ${words[i + 1]}`);
  }
  return pairs;
}

// Sentence frames that word pairs miss, named the way the speaker is told to avoid them. Agent testers quoted each as
// the surest bot tell once it came back: "6, can you back this?", "quit circling", "How admirably little ceremony."
// Words of an analyst, not a player at a game table, worn out from the first line: a judge reading whole games named
// "the vote gives us no split to read", "a point of comparison" and "4 is publicly clear" as bot tells.
const ANALYST_WORDS = {
  name: 'analyst words ("a read", "point of comparison", "footing", "publicly clear", "next step")',
  pattern:
    /\b(?:point of comparison|footing|publicly (?:clear|clean|cleared)|(?:mission|track) record|baseline|data|information|evidence|next step|split to read|(?:gives?|get|gets|getting|got)\s+(?:us\s+|me\s+)?a\s+read|sample|signal|variable|optimal|probabilit(?:y|ies)|coalition|consensus|reachable|viable)\b/i,
};

const STOCK_FRAMES = [
  ANALYST_WORDS,
  {
    name: '"can you back this?" requests',
    pattern: /\b(?:can|will|would)\s+you\s+(?:back|approve|support|commit|join|get behind)\b/i,
  },
  {
    name: '"quit circling" pushes',
    pattern: /\b(?:quit|stop)\s+(?:circling|dragging|spinning|dancing|stalling|jawing)\b/i,
  },
  { name: '"How <adjective>" quips', pattern: /(?:^|[.!?]\s+)how\s+(?:\w+ly\s+)?\w+(?:\s+\w+){0,2}[.!]/i },
  { name: '"Surely..." quips', pattern: /\bsurely\b/i },
  {
    name: '"rather <adjective>" understatements',
    pattern:
      /\brather\s+(?:\w+ly\s+)?(?:elementary|modest|sensible|bold|generous|elegant|daring|optimistic|convenient)\b/i,
  },
  {
    name: '"let\'s see how it goes" closers',
    pattern: /\blet'?s\s+(?:see\s+(?:how|what)|get\s+(?:a\s+result|this\s+moving|it\s+moving))\b/i,
  },
  { name: '"no need to" lines', pattern: /\bno\s+need\s+to\b/i },
  { name: 'smiley emoji', pattern: /[\u{1F600}-\u{1F64F}]/u },
  { name: '"X can sit this one out" lines', pattern: /\bsits?\s+(?:this\s+one|it)\s+out\b/i },
  { name: '"what would get you on" questions', pattern: /\bwhat\s+would\s+(?:get|make|put|keep)\s+(?:you|us)\b/i },
  {
    name: '"feels like a fair..." lines',
    pattern: /\b(?:feels|seems)\s+like\s+a\s+(?:fair|good|solid|reasonable|decent|comfortable|clean)\b/i,
  },
  { name: '"works for me" agreements', pattern: /\bworks\s+for\s+me\b/i },
  { name: '"keep it simple" lines', pattern: /\b(?:keep\s+it|nice\s+and|start)\s+simple\b/i },
  { name: '"tidy little" quips', pattern: /\b(?:tidy|neat|charming|lovely|cute|brave|bold|modest)\s+little\b/i },
  { name: '"hardly a..." quips', pattern: /\bhardly\s+(?:a|an|the)\b/i },
  { name: '"I\'ll own it" lines', pattern: /\b(?:I'?ll|I\s+will|I\s+can|happy\s+to)\s+own\b/i },
  // Personality catchphrases, once a game per seat: round 14 testers quoted the gambler's "fun little gamble" and
  // "rolling the dice" and the crybaby's "left out" as the bot tells.
  { name: 'gambling talk', pattern: /\b(?:gambl\w*|bets?|betting|dice|lucky|odds|punt|wager)\b/i },
  { name: '"left out" complaints', pattern: /\bleft\s+(?:out|off)\b|\bsitting\s+out\s+again\b/i },
  { name: '"streak" talk', pattern: /\bstreak\b/i },
  {
    name: '"thanks for keeping me on" lines',
    pattern:
      /\b(?:thanks|thank you|glad|happy)\b[^.!?]{0,30}\b(?:keeping|putting|having|taking|with)\s+(?:me|you)\b|\bwith you again\b/i,
  },
  { name: '"sounds fun" quips', pattern: /\b(?:sounds|feels|looks)\s+fun\b|\bfun\s+(?:little\s+)?\w+/i },
  {
    name: '"clean run" phrases',
    pattern:
      /\bclean(?:er|est)?\s+(?:run|success|result|team|mission|record|bet|change|pass|pair|trio|three)\b|\bthrough\s+clean\b/i,
  },
  {
    name: '"perfectly respectable" barbs',
    pattern: /\b(?:perfectly|admirably|refreshingly|charmingly|remarkably|delightfully|wonderfully)\s+\w+/i,
  },
];

/**
 * Phrases this table has worn out: word pairs (short and filler words skipped) in two or more chat lines, such as
 * "clean result", "proven core" or "stop cycling". Every agent tester named such stock lines as the surest bot tell.
 * A stock frame is worn out for a seat that already used it once: testers caught one seat saying "I'll own it"
 * three times and another "clean run" five times in one game (game 77).
 */
export function stalePhrases(request: BotRequest) {
  const counts = new Map<string, number>();
  for (const message of request.chat) {
    const own = message.name === request.name;
    for (const pair of wordPairs(message.text)) counts.set(pair, (counts.get(pair) || 0) + 1);
    for (const { name, pattern } of STOCK_FRAMES)
      if (pattern.test(message.text)) counts.set(name, (counts.get(name) || 0) + (own ? 2 : 1));
  }
  counts.delete(ANALYST_WORDS.name);
  return [
    ANALYST_WORDS.name,
    ...[...counts]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([pair]) => pair),
  ];
}

/** The worn-out phrases a public line would repeat. */
export function usedStalePhrases(request: BotRequest, text: string, stale = stalePhrases(request)) {
  const pairs = wordPairs(text);
  const frames = new Set(STOCK_FRAMES.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name));
  return stale.filter((phrase) => pairs.has(phrase) || frames.has(phrase));
}

// The seats a chat line argues for; "me" counts the speaker's own seat.
function namedSeats(text: string, speaker?: number) {
  const seats = new Set((text.match(/(?<![\d.,])\d(?![\d.,]\d)/g) || []).map(Number));
  if (speaker !== undefined && /\b(?:me|myself)\b/i.test(text)) seats.add(speaker);
  return [...seats].sort().join(',');
}

/**
 * A long discussion line arguing for the same seats as at least two of the last six chat lines. Human testers' most
 * consistent complaint: every bot restates the same proposal at length, where people would just agree or pass.
 */
export function restatedRoster(request: BotRequest, text: string) {
  if (!guardsEnabled() || !request.publicDiscussion || text.length < 70 || text.includes('?')) return undefined;
  const own = request.state.players?.find((p) => p.id === request.playerID)?.index;
  const seats = namedSeats(text, own);
  const count = seats ? seats.split(',').length : 0;
  if (count < 2 || count > 5) return undefined;
  const same = request.chat.slice(-6).filter((message) => namedSeats(message.text, Number(message.name)) === seats);
  return same.length >= 2 ? seats : undefined;
}

// Wanting a mission to fail, in words a Good player would not use: "we need a team that can actually reach two
// Fails", "if we're taking a shot at two Fails". The pause-level leak filter (safePublicSpeech) misses these.
const FAIL_WISH =
  /\b(?:need|needs|want|wants|give|giving|get|getting|take|taking|shot at|chance (?:at|of|to|for)|only way to|try(?:ing)? (?:to|for)|aim(?:ing)? (?:for|at)|go(?:ing)? for)\b[^.!?]{0,45}\b(?:reach|meet|hit|make|get|land|produce|fail)\w*\b[^.!?]{0,20}\bfails?\b|\b(?:shot at|chance (?:at|of|for)|reach|hit|meet|land)\s+(?:the\s+)?(?:two|2|both)[\s-]+fails?\b|\b(?:real|good|actual)\s+(?:chance|shot)\s+(?:to|at|of)\s+(?:fail|failing)\b/i;

/** The phrase in an Evil bot's public text that reads as wanting the mission to fail (two in 1,660 logged lines). */
export function failWish(request: BotRequest, text: string) {
  const own = request.state?.players?.find((p) => p.id === request.playerID);
  if (!guardsEnabled() || !own || !EVIL_ROLES.includes(own.role)) return undefined;
  return FAIL_WISH.exec(text)?.[0];
}
