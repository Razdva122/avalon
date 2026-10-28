// Every logged decision whose right answer the revealed roles now show: how often the bots got it right, and what the
// current guards would make of the same position. No API calls.
// Usage: decision-bench.ts [--flips] [--fixture=<file>] <game.json> ...
// --fixture writes the positions where a guard fires, for real-positions.test.ts.
import { readFileSync, writeFileSync } from 'fs';
import type { BotRequest } from '../client';
import { EVIL_ROLES, maskOf, seatsOf } from '../deduction';
import { guardDecision } from '../guards';

type Entry = { request?: BotRequest; role?: string; stage?: string; choice?: string; version?: string };
type Log = { trace: Entry[]; summary: { roles: [number, string][]; bots?: string } };
const bits = (mask: number) => seatsOf(mask).length;
const team = (choice: string) => maskOf(choice.split(',').map((seat) => Number(seat.trim())));

/** The right choice at this position given the revealed roles, or undefined where no single choice is right. */
function rightChoice(entry: Entry, evil: number, merlin: number): string | undefined {
  const request = entry.request!;
  const state = request.state;
  const mission = state.settings?.missions[state.mission];
  const failsRequired = mission?.failsRequired ?? 1;
  const good = !EVIL_ROLES.includes(entry.role || '');
  const missions = (state.history || []).filter((event) => event.type === 'mission' && 'fails' in event) as {
    fails: number;
    settings?: { failsRequired?: number };
  }[];
  const failures = missions.filter((m) => m.fails >= (m.settings?.failsRequired ?? 1)).length;
  const successes = missions.length - failures;
  if (entry.stage === 'votingForTeam' && good) {
    const proposed = maskOf(
      state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index),
    );
    // Evil passes a two-player opener (the card guard), so approving it is right whoever sits on it.
    if (missions.length === 0 && bits(proposed) === 2) return 'approve';
    // A team with fewer Evil than the mission's Fail threshold cannot fail it.
    return bits(proposed & evil) >= failsRequired ? 'reject' : 'approve';
  }
  if (entry.stage === 'selectTeam' && good) {
    const clean = request.choices.filter((choice) => bits(team(choice) & evil) < failsRequired);
    return clean.includes(entry.choice!) || !clean.length ? entry.choice : clean[0];
  }
  if (entry.stage === 'onMission' && !good && request.choices.includes('fail')) {
    const sent = maskOf(state.players.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index));
    if (bits(sent & evil) < failsRequired) return 'success';
    if (failures >= 2) return 'fail';
    // With more Evil aboard than Fails needed, one card's right answer depends on the allies' cards.
    if (bits(sent & evil) > failsRequired) return undefined;
    if (successes >= 2) return 'fail';
    if (missions.length === 0 && bits(sent) === 2) return 'success';
    return undefined;
  }
  if (entry.stage === 'assassinate' && !good) return String(merlin);
  return undefined;
}

const kind = (entry: Entry) =>
  `${EVIL_ROLES.includes(entry.role || '') ? 'evil' : 'good'} ${entry.stage === 'votingForTeam' ? 'vote' : entry.stage === 'selectTeam' ? 'pick' : entry.stage === 'onMission' ? 'card' : 'assassin'}`;
const rows: Record<string, { n: number; right: number; nowRight: number; fixed: number; broken: number }> = {};
const fixture: { game: string; role: string; right: string; tried: string[]; evil: number[]; request: unknown }[] = [];
// Only what the engine and the guards read, with short player ids: the full history made the fixture 1.7 MB.
function compact(request: BotRequest) {
  const id = (raw: string) => `p${request.state.players.find((p) => p.id === raw)?.index ?? raw}`;
  const history = (request.state.history || []).map((event) => {
    if (event.type === 'vote')
      return {
        type: event.type,
        result: event.result,
        forced: event.forced,
        leaderID: id(event.leaderID),
        team: event.team.map((member) => ({ id: id(member.id) })),
        votes: Array.isArray(event.votes)
          ? event.votes.map((vote) => ({ playerID: id(vote.playerID), value: vote.value }))
          : event.votes,
      };
    if (event.type === 'mission')
      return {
        type: event.type,
        index: event.index,
        result: event.result,
        fails: event.fails,
        settings: event.settings && { failsRequired: event.settings.failsRequired },
        actions: event.actions.map((action) => ({
          playerID: id(action.playerID),
          ...('value' in action && action.value ? { value: action.value } : {}),
        })),
      };
    if (event.type === 'checkLoyalty')
      return { type: event.type, validatorID: id(event.validatorID), inspectedID: id(event.inspectedID) };
    if (event.type === 'announceLoyalty')
      return {
        type: event.type,
        announcerID: id(event.announcerID),
        targetID: id(event.targetID),
        announced: event.announced,
        actual: event.actual,
      };
    return event;
  });
  return {
    playerID: id(request.playerID),
    humanPlayerIDs: request.humanPlayerIDs?.map(id),
    choices: request.choices,
    chat: [],
    state: {
      stage: request.state.stage,
      mission: request.state.mission,
      vote: request.state.vote,
      players: request.state.players.map(({ id: raw, index, role, features }) => ({
        id: id(raw),
        index,
        role,
        features: Object.fromEntries(Object.entries(features).filter(([, value]) => value)),
      })),
      settings: request.state.settings,
      history,
      addonsData: request.state.addonsData,
    },
  };
}
for (const file of process.argv.slice(2).filter((arg) => !arg.startsWith('--'))) {
  const log = JSON.parse(readFileSync(file, 'utf8')) as Log;
  const evil = maskOf(log.summary.roles.filter(([, role]) => EVIL_ROLES.includes(role)).map(([seat]) => seat));
  const merlin = log.summary.roles.find(([, role]) => role === 'merlin')?.[0] ?? 0;
  log.trace.forEach((entry, index) => {
    if (!entry.request || entry.choice === undefined) return;
    if (!['votingForTeam', 'selectTeam', 'onMission', 'assassinate'].includes(entry.stage || '')) return;
    const right = rightChoice(entry, evil, merlin);
    if (right === undefined) return;
    // The logged choice already went through that build's guards; the current guards may change it further.
    const now = guardDecision(entry.request, entry.choice)?.choice ?? entry.choice;
    const key = `${entry.version || log.summary.bots || '?'} | ${kind(entry)}${entry.role === 'merlin' ? ' (merlin)' : ''}`;
    // Merlin's cover votes trade accuracy for secrecy on purpose. Both votes and both cards are real options; for a
    // roster only the logged pick is, since "the first clean legal roster" is a team no player would choose.
    const tried =
      entry.stage === 'votingForTeam'
        ? ['approve', 'reject']
        : entry.stage === 'onMission'
          ? ['fail', 'success']
          : entry.stage === 'selectTeam'
            ? [entry.choice]
            : [entry.choice, right];
    if (entry.role !== 'merlin' && tried.some((choice) => guardDecision(entry.request!, choice)))
      fixture.push({
        game: `${file.split('/').pop()}#${index}`,
        role: entry.role!,
        right,
        tried: [...new Set(tried)],
        evil: seatsOf(evil),
        request: compact(entry.request),
      });
    const row = (rows[key] ??= { n: 0, right: 0, nowRight: 0, fixed: 0, broken: 0 });
    row.n++;
    if (entry.choice === right) row.right++;
    if (now === right) row.nowRight++;
    if (entry.choice !== right && now === right) row.fixed++;
    if (entry.choice === right && now !== right) {
      row.broken++;
      if (process.argv.includes('--flips'))
        console.log(`broken ${file.split('/').pop()}#${index} ${entry.role} ${entry.choice} -> ${now}`);
    }
  });
}
const out = process.argv.find((arg) => arg.startsWith('--fixture='))?.slice(10);
if (out) {
  writeFileSync(out, JSON.stringify(fixture));
  console.log(`${fixture.length} guarded positions written to ${out}`);
}
const pct = (part: number, whole: number) => `${Math.round((part / whole) * 100)}%`.padStart(4);
console.log('build | decision                n   logged  current guards  (fixed / broken)');
for (const [key, row] of Object.entries(rows).sort())
  console.log(
    `${key.padEnd(30)} ${String(row.n).padStart(4)}   ${pct(row.right, row.n)}    ${pct(row.nowRight, row.n)}            (${row.fixed} / ${row.broken})`,
  );
