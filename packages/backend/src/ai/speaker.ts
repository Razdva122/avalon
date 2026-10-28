import type { BotReply, BotRequest } from './client';
import type { Knowledge, ParsedGame } from './deduction';
import {
  EVIL_ROLES,
  evilProbability,
  maskOf,
  observerKnowledge,
  parseGame,
  publicGame,
  publicKnowledge,
  seatsOf,
  servantKnowledge,
  servantVote,
  standardRules,
  worlds,
} from './deduction';
import { exposedAllies, stalePhrases } from './guards';
import { languageInstruction } from './language';
import { humanSeatNumbers } from './testimony';

// Think, then talk: the decision call weighs the whole game under long rules and tends to speak in their vocabulary
// ("clean result", "proven core", "safest roster"). Once the action is final, a second short call writes the line a
// player would actually say, from what a human has in mind at that moment. Agent testers' most common complaint
// was robotic, repetitive chat that ignored their questions.

export const speakerEnabled = () => process.env.AI_SPEAKER !== 'off';

/**
 * Typography people do not type in game chat and readers take for generated text: curly quotes, em dashes and
 * semicolons (a full stop, since a comma blurs seat lists). Chinese text keeps its own punctuation.
 */
export function humanTypography(text: string, language?: string) {
  if (language === 'zh-tw') return text;
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*—\s*/g, ' - ')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/;\s+(\S)/g, (_, next: string) => `. ${next.toUpperCase()}`);
}

const STYLE_EXAMPLES = [
  'No. 4 was on both failed teams, I am not sending 4 again.',
  'Fine by me, 1 2 6.',
  'Why 7? 7 approved the team that just failed.',
  'I passed on that mission, so it is one of you two.',
  'Honestly I would rather see 3 on this one than 5.',
  'That is the exact team that failed. Hard no.',
  '5, you keep flip-flopping. Which is it?',
  'ok I trust 2 more than 5 right now.',
  'Not thrilled, but I will approve to see a result.',
  'Fair point, 3. Swap me for 6 then.',
  'Called it. 2 and 4 together was never going to pass.',
  'I was on it and played Success, so look at 1 and 5.',
  'ugh. One fail, three of us on it. Not me.',
  'Same team again? Sure, it worked.',
  'Give me one reason to trust 6 over 1.',
  'Nope, 4 rejected the only clean run. Not sending 4.',
  'Wait, 3 said they passed. So who failed it?',
  'Eh, could go either way. Leaving it to the leader.',
  'You literally voted for the failed team, 2.',
  'If 5 is good, prove it on this one.',
  'Pass. Nothing new to add.',
  'Two fails means two of them. Easy math.',
  '6 has been quiet all game, I do not love it.',
  'Lady says 1 is good, so 1 goes.',
];

// A different handful of tone examples per seat, so the bots at one table do not converge on the same phrasing.
const examplesFor = (seat: number) =>
  STYLE_EXAMPLES.filter((_, index) => (index * 7 + seat * 3) % STYLE_EXAMPLES.length < 8);

const seatMentioned = (text: string, seat: number) => new RegExp(`(?<![\\d.,])${seat}(?![\\d.,]\\d)`).test(text);

// Words that turn a mention into a challenge the named player would answer.
const CHALLENGE =
  /\?|\b(?:evil|sus|suspicious|liar|lying|lied|fail(?:ed|s)?|why|trust|shady|sketchy|wrong|blame)\b|подозр|злой|врёшь|врешь|почему|зачем|провал/i;

/**
 * Chat lines since the speaker last spoke that name their seat in a question or a challenge: people at a table always
 * answer when called out.
 */
export function addressedToYou(request: BotRequest, seat: number) {
  const own = String(seat);
  const lastOwn = request.chat.map((message) => message.name).lastIndexOf(own);
  return request.chat
    .slice(lastOwn + 1)
    .filter((message) => message.name !== own && seatMentioned(message.text, seat) && CHALLENGE.test(message.text))
    .slice(-3)
    .map((message) => ({ from: message.name, text: message.text }));
}

/** Role posture for the line, computed from the record so every seat of a side argues one consistent story. */
function plan(request: BotRequest, seat: number, role: string) {
  const state = request.state;
  if (!state?.settings || !standardRules(state)) return undefined;
  const humans = humanSeatNumbers(request);
  const knowledge = observerKnowledge(state, request.playerID, humans);
  const game = publicGame(parseGame(state, request.playerID));
  const pub = worlds(game, publicKnowledge(humans));
  const pubHard = worlds(game, publicKnowledge(humans), { behaviour: false });
  if (!pub.length) return undefined;
  const suspicion = (s: number) => evilProbability(pub, s);
  const proven = (s: number) => evilProbability(pubHard, s);
  const others = game.seats.filter((s) => s !== seat);
  if (EVIL_ROLES.includes(role)) {
    // At match point the mission outweighs cover: a caught ally who can fail it is not cut loose.
    const failures = game.missions.filter((m) => m.fails >= m.failsRequired).length;
    const matchPoint = failures >= 2 || game.missions.length - failures >= 2;
    const exposed = matchPoint ? [] : exposedAllies(request) || [];
    // The same Good-looking target for every Evil seat that sees the others: one story reads as independent agreement.
    const target = others
      .filter((s) => !(knowledge.evil & (1 << s)) && proven(s) >= 0.0001)
      .sort((a, b) => suspicion(b) - suspicion(a))[0];
    return {
      side: 'evil',
      posture:
        'Sound exactly like a reasonable Good player. Argue from the record, defend yourself with your own votes and cards, never defend a seat listed in cutLoose, and agree when the table is already against them.' +
        (target !== undefined && suspicion(target) >= 0.25
          ? ` If you accuse anyone, keep it on ${target}, whom the table already half-suspects, with a real vote or mission fact.`
          : '') +
        voteCover(game, knowledge, seat, state.mission, suspicion, knowledge.evil),
      ...(exposed.length ? { cutLoose: exposed } : {}),
    };
  }
  const provenEvil = game.seats.filter((s) => proven(s) > 0.9999);
  const provenGood = game.seats.filter((s) => proven(s) < 0.0001);
  const proofs = provenEvil.length || provenGood.length ? { provenEvil, provenGood } : undefined;
  if (role === 'merlin')
    return {
      side: 'good',
      posture:
        'You are hiding from the assassin. Never be the first to doubt a seat: only echo doubts someone already voiced or the record already supports, and let others lead. Short agreement is better than a perfect plan. Never publicly defer to or follow one player ("your call", "I\'ll go with 1"): agree on the merits, so you are not paired with an informed player.' +
        voteCover(game, knowledge, seat, state.mission, suspicion, knowledge.evil),
      ...(proofs ? { publicProofs: proofs } : {}),
      publiclySuspected: others.filter((s) => suspicion(s) >= 0.5),
    };
  const wizards = state.players.filter((p) => p.role === 'mysteryWizard').map((p) => p.index);
  return {
    side: 'good',
    posture:
      'Help your team: state a public proof the table has not said yet or call out a claim that contradicts the record when there is one.' +
      (role === 'percival' && wizards.length
        ? ` Never vouch for, defend or single out ${wizards.join(' or ')}: that points the assassin at Merlin. Sounding sure of your own reads draws the assassin to you instead.` +
          voteCover(game, knowledge, seat, state.mission, suspicion, maskOf(wizards))
        : ''),
    ...(proofs ? { publicProofs: proofs } : {}),
  };
}

/**
 * Votes are silent and nobody speaks between a proposal and its vote, so a seat with secret knowledge cannot explain
 * beforehand a vote that set it apart from a Servant, and assassins read exactly those (game 85's council named
 * Merlin for rejecting a team it sat on). When asked, Merlin, Percival or an Evil seat gives a reason a Servant could
 * have had instead of improvising one from what it knows; the seat it "wanted on instead" is never one in `avoid`
 * (an ally, or Percival's Merlin and Morgana).
 */
function voteCover(
  game: ParsedGame,
  knowledge: Knowledge,
  seat: number,
  mission: number,
  suspicion: (seat: number) => number,
  avoid: number,
) {
  // The most recent vote, this mission or the last, that a Servant in this seat would have cast the other way.
  const last = [...game.proposals].reverse().find((p, back) => {
    if (p.forced || p.leader === seat || p.mission < mission - 1 || !((p.approvals | p.rejections) & (1 << seat)))
      return false;
    const index = game.proposals.length - 1 - back;
    const record = {
      ...game,
      missions: game.missions.slice(0, p.mission),
      proposals: game.proposals.slice(0, index),
      announcements: game.announcements.filter((check) => check.afterMissions <= p.mission),
    };
    const failures = record.missions.filter((m) => m.fails >= m.failsRequired).length;
    const servant = servantVote(record, servantKnowledge(knowledge), p.team, {
      teamSize: seatsOf(p.team).length,
      failsRequired: p.failsRequired,
      successesBefore: record.missions.length - failures,
      failuresBefore: failures,
      first: !record.missions.length,
    });
    return servant !== undefined && servant !== (p.approvals & (1 << seat) ? 'approve' : 'reject');
  });
  if (!last) return '';
  const vote = last.approvals & (1 << seat) ? 'approve' : 'reject';
  const team = seatsOf(last.team).join(', ');
  if (vote === 'approve')
    return ` Your approval of ${team} stood out. Only if someone asks about it, give a reason a Servant could have had: ${last.team & (1 << seat) ? 'you were on it' : 'not wanting to burn a proposal'}.`;
  const instead = game.seats
    .filter((s) => s !== seat && !(last.team & (1 << s)) && !(avoid & (1 << s)))
    .sort((a, b) => suspicion(a) - suspicion(b))[0];
  return ` Your rejection of ${team} stood out. Only if someone asks about it, say you wanted ${instead ?? 'someone else'} on it instead; say nothing against anyone on it whom nobody else doubts.`;
}

export function speakerInstructions(request: BotRequest) {
  const seat = request.state.players?.find((p) => p.id === request.playerID)?.index ?? 0;
  return (
    languageInstruction(request.language) +
    ' You are a player at an online Avalon table, writing your next chat line. The decision is already made; write only what you say. you.personality is your voice, in the table language, and you.voice says how much of it shows. On a "light" line you type like any regular player: the personality only in a word or two of temper, no signature quip, no flourish, no emoji. On a "full" line its vocabulary, temper and rhythm come through. Even a formal, superior or precise persona types casually in a game chat: short digs and contractions, never written-essay phrasing like "rather elementary" or "the less useful option". Sound like a sharp human typing in a fast online game chat: specific, usually one short sentence, at most two, never over 240 characters. Contractions and fragments are fine; no semicolons. Use bare seat numbers. gist is what you want across, drafted by your planning notes in the wrong voice: keep its point, never its wording. Say "team", not "roster" or "lineup", and none of the analyst words people never type in game chat: baseline, core, data, information, test, concrete, track record, coalition, evidence chain. Answer anything in addressedToYou first: a question or an accusation aimed at you always gets a direct reply, answered straight rather than restated ("2, you asked about..."), and naming the asker only sometimes. Talk to the person you answer as "you", not about them in the third person. Otherwise react to the moment, including a mission that just resolved (record.lastMission). Real chat is mixed, so vary the shape: a reaction, a complaint, a joke, one pointed question, a one-word agreement or a team suggestion. If an earlier speaker in this discussion already suggested a team, react to that one (go with it, swap one seat, or object) instead of inventing a different team of your own. Most lines need no team recommendation and no acknowledgement of the previous speaker, and none should end in an order just by habit. Do not recruit votes by asking a named seat to back, approve or commit to a team ("4, can you back this?"): people say what they think and let others decide. On a discussion turn you may also pass with an empty publicReason when your point is already on the table and nobody addressed you; at a real table not everyone talks every round. Most lines need no fact at all: people react ("ugh, of course"), show how they feel about a seat or the game, joke, or make a read of the whole table ("this table trusts 3 way too much"). When you do cite a fact, cite one, and only as it appears in record; never stack vote history as a rebuttal. Never repeat a point an earlier speaker in conversation already made (that no missions have run, that a success clears nobody) or reuse an expression someone there already used ("give it a shot", "take a swing"): add what is new in your own words, keep it to a few words or pass. Never repeat your own earlier lines, their sentence frame or their kind of quip ("Surely...", "How daring..."), or anything in wornOutPhrases, never restate a team others already backed at length, and never open by declaring your own side. Do not narrate your reasoning ("based on the record", "weighing the options"), summarize the game, hedge, thank anyone or explain the rules; vary how you open instead of starting with "I", and never use stock openers like "Fair point", "I hear you", "I appreciate" or "Agreed, but", or filler closers like "let\'s see how it goes", "let\'s see how the vote lands", "let\'s get this moving" or "feels like a fair/decent next step". Never reveal a role, a secret ally, Merlin or anything only you could know; never say you want a mission to fail. The posture in plan decides what you argue.' +
    (request.beginner ? ' This is a beginner table: plain words, one idea.' : '') +
    ` Examples of length and casualness only, never of wording or voice: ${examplesFor(seat)
      .map((line) => `"${line}"`)
      .join(' ')}` +
    ' Return the same choice you are given and put your line in publicReason; speech holds one short private note.'
  );
}

// A first-person Fail card ("I failed M2", "I played a Fail"): nobody admits one, and a Good seat never plays one.
const FAIL_CONFESSION =
  /\b(?:i|we)\s+(?:(?:played|put(?:\s+in)?|threw|dropped|cast|used)\s+(?:a\s+|the\s+|my\s+)?fail|failed\s+(?:it|that|this|the\s+mission|m\d|mission\s*\d))/i;
export const confessesFail = (text: string) => FAIL_CONFESSION.test(text);

/**
 * The room prints "I propose 2, 3, 6." before a leader's line, so a line that opens by naming the same team again
 * ("I'll go 2, 3, 6.", "2, 3, 6: ...") reads as a stutter; that opening is dropped.
 */
export function withoutTeamRepeat(text: string, choice: string) {
  const team = choice
    .split(',')
    .map((seat) => seat.trim())
    .sort()
    .join(',');
  const match = text.match(
    /^\s*(?:(?:i(?:'ll| will)?|let's|we)\s+(?:go(?:\s+with)?|propose|send|take|run(?:\s+with)?)\s+|sending\s+|going\s+with\s+|my\s+team(?:\s+is)?\s*:?\s*)?([1-8](?:\s*(?:,|and|&)\s*[1-8])+)\s*(?:it\s+is)?\s*[:.,!-]+\s*/i,
  );
  if (!match) return text;
  const named = (match[1].match(/[1-8]/g) || []).sort().join(',');
  if (named !== team) return text;
  const rest = text.slice(match[0].length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

const EMOJI = /\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu;
// Without the global flag: test() on a global pattern keeps its position between calls.
const HAS_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/**
 * At most one emoji in four lines per seat: the friendly persona put a smiley on every line, which testers quoted as
 * the most robotic thing it did (its own instructions say most replies have none).
 */
export function withoutRepeatedEmoji(request: BotRequest, seat: number, text: string) {
  const recent = request.chat.filter((message) => message.name === String(seat)).slice(-3);
  return recent.some((message) => HAS_EMOJI.test(message.text)) ? text.replace(EMOJI, '').trim() : text;
}

// A spoken pass ("No new point to add.") reads as a bot; people just stay quiet.
const SPOKEN_PASS =
  /^\s*(?:(?:(?:i\s+have\s+)?(?:no(?:thing)?)\s+(?:new\s+)?(?:(?:point|points|comment|comments)\s+)?(?:to\s+add|from\s+me|here)|no\s+comment|pass(?:ing)?|nothing\s+new)[.!,]*\s*)+$/i;
export const spokenPass = (text: string) => SPOKEN_PASS.test(text);

const VOTE_CLAIM =
  /((?:[1-8](?:\s*(?:,|and|&)\s*)?)+)\s+(?:both\s+|all\s+|also\s+)?(approved|voted\s+for|rejected|voted\s+against|voted\s+down)\b/gi;

/**
 * A claim that a seat cast a vote it never cast ("3 and 6 both approved 4 earlier" before any vote): testers caught
 * bots inventing votes, the most damaging tell since anyone can check the record. Only explicit vote verbs count;
 * "backed" or "supported" may describe chat.
 */
export function falseVoteClaim(request: BotRequest, text: string) {
  const seatOf = new Map(request.state.players.map((p) => [p.id, p.index]));
  const cast = new Set<string>();
  for (const event of request.state.history || []) {
    const vote = event as { type: string; forced?: boolean; votes?: { playerID: string; value: string }[] };
    if (vote.type !== 'vote' || vote.forced || !Array.isArray(vote.votes)) continue;
    for (const v of vote.votes) cast.add(`${seatOf.get(v.playerID)}:${v.value}`);
  }
  for (const match of text.matchAll(VOTE_CLAIM)) {
    const value = /approved|voted\s+for/i.test(match[2]) ? 'approve' : 'reject';
    const seats = match[1].match(/[1-8]/g) || [];
    const wrong = seats.find((seat) => !cast.has(`${seat}:${value}`));
    if (wrong) return `${wrong} never ${value === 'approve' ? 'approved' : 'rejected'} a team`;
  }
  return undefined;
}

type PublicRecord = { missions?: unknown[]; votes?: unknown[] };

export function speakerContext(request: BotRequest, reply: BotReply, record: PublicRecord, draft: string) {
  const own = request.state.players.find((p) => p.id === request.playerID)!;
  const choice = request.choices[reply.choice];
  const action = request.councilDiscussion
    ? `Evil council, out in the open now: you recommend shooting ${choice} as Merlin. The table already sees "Evil council - my pick is ${choice}." before your line, so give your one best clue for ${choice} and the alternative you weighed, and answer an ally who disagreed.`
    : request.publicDiscussion
      ? `In this discussion you would send ${choice}.`
      : request.state.stage === 'selectTeam'
        ? `You are the leader and are sending ${choice} now. The table already sees your team printed before your line, so do not name the team again: give the one reason it is right, or answer a seat.`
        : request.state.stage === 'votingForTeam'
          ? `You vote ${choice}.`
          : `Your action: ${choice}.`;
  const ownLines = request.chat.filter((message) => message.name === String(own.index)).slice(-4);
  return {
    // Real players have a character but type plainly most of the time; a judge reading whole games picked bots out by
    // personality played on every line ("spectacularly sideways", "glad to be with you again"). It shows in full on
    // every third line of a seat.
    you: {
      seat: own.index,
      personality: request.style,
      voice: request.chat.filter((message) => message.name === String(own.index)).length % 3 ? 'light' : 'full',
    },
    action,
    gist: draft || undefined,
    plan: request.councilDiscussion
      ? {
          side: 'evil',
          posture: 'The game is over unless you find Merlin: talk it through like a teammate, not a report.',
        }
      : plan(request, own.index, own.role),
    addressedToYou: addressedToYou(request, own.index),
    conversation: request.chat.slice(-10).map((message) => ({ seat: message.name, text: message.text })),
    yourEarlierLines: ownLines.map((message) => message.text),
    wornOutPhrases: stalePhrases(request),
    record: {
      missions: record.missions,
      lastMission: record.missions?.[record.missions.length - 1],
      recentVotes: (record.votes || []).slice(-4),
    },
    seats: seatsOf(request.state.players.reduce((mask, p) => mask | (1 << p.index), 0)),
  };
}
