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
  standardRules,
  teamRisk,
  worlds,
} from './deduction';
import type { MissionContext, ParsedGame } from './deduction';
import { conventionSaboteurs, exposedAllies, servantLikeVote } from './guards';
import { assassinationCandidates, merlinHunt } from './merlin';
import { humanSeatNumbers } from './testimony';

// Private, per-observer analysis for the model. Never published: public speech must still argue from public facts.

const pct = (value: number) => Math.round(value * 100);
// Only proofs may read as certain; behavioural estimates stay within 1-99%.
const estimate = (value: number, hard?: number) =>
  hard !== undefined && (hard > 0.9999 || hard < 0.0001) ? pct(hard) : Math.min(99, Math.max(1, pct(value)));
const parseTeam = (choice: string) =>
  /^\d(\s*,\s*\d)*$/.test(choice) ? maskOf(choice.split(',').map((seat) => Number(seat.trim()))) : undefined;

function status(p: number, hard: number) {
  if (hard > 0.9999) return 'provenEvil';
  if (hard < 0.0001) return 'provenGood';
  if (p >= 0.85) return 'likelyEvil';
  if (p >= 0.6) return 'leansEvil';
  if (p <= 0.15) return 'likelyGood';
  if (p <= 0.4) return 'leansGood';
  return 'unclear';
}

function missionContext(request: BotRequest, game: ParsedGame): MissionContext {
  const state = request.state;
  return {
    teamSize: state.settings?.missions[state.mission]?.players,
    failsRequired: state.settings?.missions[state.mission]?.failsRequired ?? 1,
    successesBefore: game.missions.filter((m) => m.fails < m.failsRequired).length,
    failuresBefore: game.missions.filter((m) => m.fails >= m.failsRequired).length,
    first: game.missions.length === 0,
  };
}

export function buildAnalysis(request: BotRequest) {
  const state = request.state;
  const own = state?.players?.find((p) => p.id === request.playerID);
  if (!own || !state.settings || state.stage === 'end' || !standardRules(state)) return undefined;
  const humans = humanSeatNumbers(request);
  const game = parseGame(state, request.playerID);
  const knowledge = observerKnowledge(state, request.playerID, humans);
  const evilSide = EVIL_ROLES.includes(own.role);
  const mine = worlds(game, knowledge);
  const hard = worlds(game, knowledge, { behaviour: false });
  const pubGame = publicGame(game);
  const pub = worlds(pubGame, publicKnowledge(humans));
  if (!mine.length || !hard.length || !pub.length)
    return { warning: 'Records conflict with the standard rules; reason manually from the raw history.' };
  const context = missionContext(request, game);
  const score = { successes: context.successesBefore, failures: context.failuresBefore };
  const stakes =
    score.failures >= 2
      ? 'Evil wins immediately if this mission fails.'
      : score.successes >= 2
        ? 'If this mission succeeds Good has three successes; Evil then gets one Merlin assassination guess.'
        : undefined;
  const others = game.seats.filter((seat) => seat !== own.index);
  const seats = others.map((seat) => {
    const p = evilProbability(mine, seat);
    const proof = evilProbability(hard, seat);
    return {
      seat,
      evilChance: estimate(p, proof),
      status: knowledge.evil & bit(seat) ? 'knownEvil' : status(p, proof),
    };
  });
  const pubHard = worlds(pubGame, publicKnowledge(humans), { behaviour: false });
  const publicView = game.seats.map((seat) => ({
    seat,
    evilChance: estimate(evilProbability(pub, seat), evilProbability(pubHard, seat)),
  }));
  const analysis: Record<string, unknown> = {
    how: 'Exact server bookkeeping from engine records and your private knowledge. Trust it over your own arithmetic.',
    you: {
      seat: own.index,
      role: own.role,
      side: evilSide ? 'evil' : 'good',
      goal: evilSide
        ? 'You are EVIL: you want missions to FAIL (three failures win) or Merlin assassinated after three successes. You may lie.'
        : 'You are GOOD: you want missions to SUCCEED (three successes) while keeping Merlin hidden. Good bots never lie about Lady results.',
    },
    ...(stakes ? { stakes } : {}),
    seats,
    publicView: {
      meaning: 'What someone with only public records would estimate; use it for public arguments and cover.',
      seats: publicView,
    },
  };
  // Proofs from public records alone: anyone could state them, so Good teammates should.
  const provenEvil = game.seats.filter((seat) => evilProbability(pubHard, seat) > 0.9999);
  const provenGood = game.seats.filter((seat) => evilProbability(pubHard, seat) < 0.0001);
  if (!evilSide && (provenEvil.length || provenGood.length))
    analysis.publicProofs = {
      ...(provenEvil.length ? { provenEvil } : {}),
      ...(provenGood.length ? { provenGood } : {}),
      meaning:
        'The public record alone proves these, so stating one reveals nothing private. If the table has not said it yet, say it plainly with its reason (the Fail count, a success or a Lady result): it is the most useful thing a teammate can hear.',
    };
  // Evil wins arguments with one consistent story: a Good seat the table already half-suspects is the easiest frame.
  if (evilSide) {
    const frames = game.seats
      .filter((seat) => !(knowledge.evil & bit(seat)) && evilProbability(pubHard, seat) >= 0.0001)
      .map((seat) => ({ seat, publicEvilChance: pct(evilProbability(pub, seat)) }))
      .filter((row) => row.publicEvilChance >= 25)
      .sort((a, b) => b.publicEvilChance - a.publicEvilChance)
      .slice(0, 2);
    if (frames.length)
      analysis.frameTargets = {
        seats: frames,
        advice:
          'Seats you do not know as Evil that the public record already partly suspects. Strong Evil players build one consistent public case against such a seat across the game, from real votes and missions, instead of new accusations each turn. Oberon: these may still be allies.',
      };
  }
  // At match point the mission outweighs cover, so a caught ally who can fail it is still worth sending.
  const matchPoint = context.failuresBefore >= 2 || context.successesBefore >= 2;
  const exposed = matchPoint ? undefined : exposedAllies(request);
  if (exposed?.length)
    analysis.exposedAllies = {
      seats: exposed,
      advice:
        'The table already sees these allies as Evil. Strong Evil players cut such an ally loose: do not propose, defend or argue for them and do not approve rosters with them; agreeing with the public case against them buys you trust. Your Fails can come from you and the allies still trusted.',
    };
  const teamStage = ['selectTeam', 'votingForTeam'].includes(state.stage);
  if (teamStage) {
    const size = state.settings.missions[state.mission]?.players ?? 0;
    const legal =
      state.stage === 'selectTeam'
        ? request.choices.map(parseTeam).filter((team): team is number => team !== undefined)
        : combinations(game.seats, size);
    const rows = legal.map((team) => {
      const risk = teamRisk(mine, team, context);
      const proven = teamRisk(hard, team, context).capable;
      return {
        team,
        fail: risk.fail,
        publicFail: teamRisk(pub, team, context).fail,
        provenUnsafe: proven > 0.9999,
        provenSafe: proven < 0.0001,
        knownEvil: bits(team & knowledge.evil),
        you: Boolean(team & bit(own.index)),
      };
    });
    const describe = (row: (typeof rows)[number]) =>
      evilSide
        ? {
            team: label(row.team),
            knownEvilOnTeam: row.knownEvil,
            canFail: row.knownEvil >= context.failsRequired,
            publicFailRisk: estimate(row.publicFail),
          }
        : {
            team: label(row.team),
            failRisk: row.provenSafe ? 0 : estimate(row.fail),
            ...(row.provenUnsafe ? { provenUnsafe: true } : {}),
            ...(row.provenSafe ? { provenSafe: true } : {}),
            publicFailRisk: estimate(row.publicFail),
          };
    const proposedMask = maskOf(
      state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index),
    );
    const proposed = state.stage === 'votingForTeam' ? rows.find((row) => row.team === proposedMask) : undefined;
    const safest = [...rows].sort(
      (a, b) => a.fail - b.fail || Number(b.you) - Number(a.you) || a.publicFail - b.publicFail,
    );
    analysis.teams = {
      failsRequired: context.failsRequired,
      ...(proposed
        ? {
            proposed: {
              ...describe(proposed),
              ...(evilSide ? {} : { rankAmongLegalTeams: safest.indexOf(proposed) + 1, ofTeams: safest.length }),
            },
          }
        : {}),
      ...(evilSide
        ? {
            sabotageTeamsThatLookSafest: [...rows]
              .filter((row) => row.knownEvil >= context.failsRequired)
              .sort((a, b) => a.publicFail - b.publicFail || a.knownEvil - b.knownEvil)
              .slice(0, 4)
              .map(describe),
            teamsGoodWillLikelyWant: [...rows]
              .sort((a, b) => a.publicFail - b.publicFail)
              .slice(0, 3)
              .map(describe),
          }
        : { safest: safest.slice(0, 5).map(describe) }),
    };
  }
  if (own.role === 'merlin' && (teamStage || state.stage === 'checkLoyalty')) {
    // Run the assassin's own detector on Merlin's record: the assassin will know every Evil seat.
    const candidates = game.seats.filter((seat) => !(knowledge.evil & bit(seat)));
    const look = (record: ParsedGame) => {
      const ranking = merlinHunt(record, humans, knowledge.evil, 0, candidates);
      const row = ranking.find((entry) => entry.seat === own.index)!;
      return { yourMerlinChance: row.merlinChance, yourRank: ranking.indexOf(row) + 1 };
    };
    const withProposal = (team: number, leader: number, vote?: 'approve' | 'reject'): ParsedGame => ({
      ...game,
      proposals: [
        ...game.proposals,
        {
          mission: game.missions.length,
          attempt: state.vote,
          leader,
          team,
          forced: false,
          approvals: vote === 'approve' ? bit(own.index) : 0,
          rejections: vote === 'reject' ? bit(own.index) : 0,
          failsRequired: context.failsRequired,
          result: 'approve',
        },
      ],
    });
    const now = look(game);
    const view: Record<string, unknown> = {
      meaning:
        'How Merlin-like your votes and proposals look to an assassin who will learn every Evil seat. Being assassinated loses exactly like three failed missions, so weigh exposure against mission risk.',
      ...now,
      ofCandidates: candidates.length,
    };
    const leader = state.players.find((p) => p.features.isLeader)?.index ?? own.index;
    const proposedTeam = maskOf(
      state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index),
    );
    if (state.stage === 'votingForTeam' && proposedTeam) {
      view.ifYouApprove = look(withProposal(proposedTeam, leader, 'approve'));
      view.ifYouReject = look(withProposal(proposedTeam, leader, 'reject'));
      const cover = servantLikeVote(request);
      if (cover) view.servantLikeVote = cover;
    }
    const teams = analysis.teams as { safest?: { team: string }[] } | undefined;
    if (state.stage === 'selectTeam' && leader === own.index && teams?.safest)
      for (const row of teams.safest)
        Object.assign(row, {
          yourMerlinChanceIfProposed: look(withProposal(parseTeam(row.team) ?? 0, own.index)).yourMerlinChance,
        });
    analysis.assassinView = view;
  }
  if (state.stage === 'onMission' && evilSide) {
    const team = maskOf(state.players.filter((p) => p.features.isSent || p.features.isSelected).map((p) => p.index));
    const known = bits(team & knowledge.evil);
    const unknownEvil = Math.max(...hard.map((world) => bits(world.evil & team & ~knowledge.evil)));
    const canChange = known + unknownEvil >= context.failsRequired;
    const hypothetical = (fails: number) => {
      const after = worlds(
        {
          ...pubGame,
          missions: [
            ...pubGame.missions,
            {
              index: state.mission,
              team,
              fails,
              failsRequired: context.failsRequired,
              successesBefore: context.successesBefore,
              failuresBefore: context.failuresBefore,
              cards: new Map(),
            },
          ],
        },
        publicKnowledge(humans),
      );
      return after.length ? pct(evilProbability(after, own.index)) : undefined;
    };
    const convention = () => {
      const saboteurs = conventionSaboteurs(team, knowledge.evil, context.failsRequired);
      if (bits(team & knowledge.evil) <= context.failsRequired) return undefined;
      if (score.failures >= 2) return 'A Fail wins the game now, so every Evil card may be a Fail.';
      return saboteurs.includes(own.index)
        ? `You are among the lowest-numbered Evil you know on this team: if it is to fail, your Fail is needed, and ${label(team & knowledge.evil & ~maskOf(saboteurs))} will play Success.`
        : `Play Success: by the convention ${label(maskOf(saboteurs))} play${saboteurs.length > 1 ? '' : 's'} the Fail, and a second Fail only exposes you.`;
    };
    analysis.missionCard = {
      failsRequired: context.failsRequired,
      knownEvilOnTeamIncludingYou: known,
      possibleUnseenEvilOnTeam: unknownEvil,
      yourFailCanChangeResult: canChange,
      failWinsGameNow: canChange && score.failures >= 2,
      successGivesGoodThirdWin: score.successes >= 2,
      yourPublicSuspicionNow: pct(evilProbability(pub, own.index)),
      yourPublicSuspicionIfOneFailShows: hypothetical(1),
      yourPublicSuspicionIfMissionSucceeds: hypothetical(0),
      convention: convention(),
    };
  }
  if (state.stage === 'checkLoyalty') {
    analysis.ladyTargets = request.choices
      .map(Number)
      .filter((seat) => Number.isInteger(seat))
      .map((seat) => {
        const p = evilProbability(mine, seat);
        return {
          seat,
          evilChance: pct(p),
          informationValue: pct(4 * p * (1 - p)),
          publicEvilChance: pct(evilProbability(pub, seat)),
        };
      })
      .sort((a, b) => b.informationValue - a.informationValue);
  }
  if (state.stage === 'announceLoyalty' && evilSide) {
    const target = state.players.find((p) => p.features.isSelected)?.index;
    if (target !== undefined) {
      const outcome = (announcedEvil: boolean) => {
        const after = worlds(
          {
            ...pubGame,
            announcements: [
              ...pubGame.announcements,
              { by: own.index, target, announcedEvil, afterMissions: game.missions.length },
            ],
          },
          publicKnowledge(humans),
        );
        return after.length
          ? {
              yourPublicSuspicion: pct(evilProbability(after, own.index)),
              targetPublicSuspicion: pct(evilProbability(after, target)),
            }
          : { contradictsPublicRecords: true };
      };
      const targetRole = state.players.find((p) => p.index === target)?.role || '';
      const checkedEvil = request.privateCheck === 'evil' || EVIL_ROLES.includes(request.privateCheck || '');
      // Merlin sees every Evil except Mordred. An Evil result on a seat you cannot see is Oberon, unless you are
      // Oberon yourself and see nobody.
      const merlinSeesTargetAsEvil = !checkedEvil
        ? false
        : targetRole === 'mordred'
          ? false
          : EVIL_ROLES.includes(targetRole) || own.role !== 'oberon'
            ? true
            : 'unknown: the target may be Mordred';
      // An Evil result on a seat this Evil player could not see is an ally (Oberon, or any ally for Oberon). Merlin
      // already sees Morgana, the Minion and Oberon as Evil, so for them calling that ally Good costs nothing with
      // Merlin; testers kept seeing Morgana burn Oberon and Oberon burn Morgana. Mordred's trade-off differs.
      const unseenAlly = checkedEvil && targetRole === 'unknown' && own.role !== 'mordred';
      analysis.announcement = {
        target,
        ifYouAnnounceGood: outcome(false),
        ifYouAnnounceEvil: outcome(true),
        actualResult: request.privateCheck,
        youMayLie: true,
        merlinSeesTargetAsEvil,
        ...(unseenAlly
          ? {
              unseenAlly:
                'This Evil result is an ally you could not see. Merlin already sees you as Evil, so calling them Good costs you nothing with Merlin and keeps them on teams; announcing Evil burns your ally for a little credibility.',
            }
          : {}),
      };
    }
  }
  if (state.stage === 'assassinate' && evilSide) {
    analysis.merlinCandidates = assassinationCandidates(request);
    analysis.merlinHow =
      'merlinChance compares each vote with the vote a Servant in that seat would have cast from the public record at the time: Merlin sees every Evil except Mordred, so Merlin departs from the Servant vote to reject visible Evil or approve teams whose only Evil is Mordred. Those votes count most; approving a roster with Evil Merlin sees also counts against, and approving one whose only Evil is Mordred counts for. Bot Merlins vote like Servants before any failure, so early votes say little. Weigh it with chat clues and Percival behaviour.';
    delete analysis.seats;
  }
  return analysis;
}
