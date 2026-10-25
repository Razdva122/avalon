// Bot table with human seats, played through the room's own human path (the with-friend mode for two or more).
// Each human seat gets a file mailbox; seat.ts is the command a person or an agent uses to play it. The room
// runs without turn timers here; an unanswered turn falls back to a default action after AI_LAB_TURN_MINUTES.
// --deal-only prints the seats and roles for AI_LAB_SEED without any model call, to pick deals; --fake-bots always
// takes the first legal choice, to check the mailbox flow for free. --evil-bots=old|new runs the Evil bot seats on
// another build than --bots, to score one side's play against the same opponents. The output lists every model call
// with its phase and token usage (token-report.ts); --fake-model answers them with canned replies, to count calls and
// prompt sizes for free.
// Bots run through the local Codex CLI and its ChatGPT login, as production does.
// Usage: AI_LAB_SEED=11 [AI_LAB_BASELINE=/abs/baseline-ai] \
//   npx ts-node --transpile-only src/ai/lab/human-play.ts --players=7 --humans=2 --bots=new [--evil-bots=old] \
//   --dir=/abs/mailbox --out=/abs/game.json [--deal-only]
import './seeded-random';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AiPlayerCount, Server, VisualGameState } from '@avalon/types';
import type { TGameMethodsParams } from '../../core/game-manager';
import { buildCodexPrompt, codexSchema, runCodex } from '../codex';
import { callEffort } from '../codex-models';
import { AiPause } from '../client';
import type { BotRequest, Decide } from '../client';
import { decisionPipeline } from '../pipeline';
import { BotRoom } from '../room';
import { getBotProfile, selectBotAgents } from '../agents';
import { EVIL_ROLES } from '../deduction';
import { labParse } from './parse';

const arg = (name: string, fallback?: string) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;

const ROLE: Record<string, string> = {
  merlin: 'Merlin',
  percival: 'Percival',
  servant: 'Loyal Servant',
  mordred: 'Mordred',
  morgana: 'Morgana',
  oberon: 'Oberon',
  minion: 'Minion of Mordred',
  evil: 'Evil',
  mysteryWizard: 'Merlin or Morgana',
};

type Answer = {
  say?: unknown;
  pass?: unknown;
  team?: unknown;
  vote?: unknown;
  card?: unknown;
  target?: unknown;
  announce?: unknown;
};
type Seat = { n: number; key?: string; chat: number; asked: number; answered?: number; answeredAt?: number };

async function main() {
  const players = Number(arg('players', '7')) as AiPlayerCount;
  const humans = Number(arg('humans', '1'));
  const bots = arg('bots', 'new')!;
  const evilBots = arg('evil-bots', bots)!;
  // Names the build in the log, so two runs of the current code can be told apart.
  const build = arg('label', bots)!;
  const model = arg('model', 'gpt-6-luna')!;
  const reasoning = arg('reasoning', 'medium')!;
  const dir = arg('dir');
  const out = arg('out');
  const dealOnly = process.argv.includes('--deal-only');
  const turnLimitMs = Number(process.env.AI_LAB_TURN_MINUTES || 25) * 60000;
  const ids = Array.from({ length: humans }, (_, index) => `human-${index + 1}`);
  const names: Record<string, string> = Object.fromEntries(ids.map((id, index) => [id, ['Alex', 'Sam', 'Jo'][index]]));
  if (!dealOnly && !dir) throw Error('--dir is required');

  const trace: Record<string, unknown>[] = [];
  const humanTrace: Record<string, unknown>[] = [];
  let decide: Decide = async () => {
    throw new AiPause('No model calls with --deal-only');
  };
  // Each model call's phase, reasoning, prompt size and token usage. --fake-model runs the real pipelines on canned
  // replies instead of the model, to count calls and prompt sizes for free.
  const fakeModel = process.argv.includes('--fake-model');
  const calls: { phase: string; stage: string; reasoning: string; chars: number; usage?: unknown }[] = [];
  if (process.argv.includes('--fake-bots'))
    decide = async (request) => ({
      choice: 0,
      speech: request.speak ? `Seat ${request.name} has nothing to add.` : '',
    });
  else if (!dealOnly) {
    const baseline = process.env.AI_LAB_BASELINE;
    if ([bots, evilBots].includes('old') && !baseline) throw Error('AI_LAB_BASELINE is not set');
    const generate: Parameters<typeof decisionPipeline>[0] = async (request, options, signal) => {
      const built = buildCodexPrompt(options.instructions, options.context, options.cacheInstructions);
      const effort = callEffort(reasoning, options.weight, ['minimal', 'low', 'medium', 'high']);
      const call = { phase: options.phase || 'decision', stage: request.state.stage, reasoning: effort };
      if (fakeModel) {
        calls.push({ ...call, chars: built.prompt.length });
        // Distinct short lines, so the speech checks rarely ask for rewrites; a leader includes itself.
        const own = request.state.players.find((p) => p.id === request.playerID)?.index;
        const team = request.choices.findIndex((c) => c.split(', ').includes(String(own)));
        return {
          choice:
            request.state.stage === 'selectTeam' && team >= 0
              ? team
              : Math.floor(Math.random() * request.choices.length),
          speech: 'private',
          publicReason: request.speak || request.councilDiscussion ? `line ${calls.length} from ${own}` : '',
          evidence: [],
        };
      }
      const result = await runCodex(
        built.prompt,
        codexSchema(request.choices, Boolean(options.decisionDetails), request.state.stage === 'end', request),
        signal,
        { model, reasoning: effort },
        built.instructions,
      );
      calls.push({ ...call, chars: built.prompt.length, usage: result.usage });
      return labParse(result.text, request, Boolean(options.decisionDetails));
    };
    const pipeline = (which: string) =>
      (which === 'old'
        ? // eslint-disable-next-line @typescript-eslint/no-var-requires
          (require(join(baseline!, 'pipeline')) as { decisionPipeline: typeof decisionPipeline }).decisionPipeline
        : decisionPipeline)(generate);
    const good = pipeline(bots);
    const evil = evilBots === bots ? good : pipeline(evilBots);
    decide = (request, signal) => {
      const role = request.state.players.find((p) => p.id === request.playerID)?.role || '';
      return (EVIL_ROLES.includes(role) ? evil : good)(request, signal);
    };
  }
  const logged = async (request: BotRequest, signal?: AbortSignal) => {
    const own = request.state.players.find((p) => p.id === request.playerID)!;
    const started = Date.now();
    try {
      const reply = await decide(request, signal);
      trace.push({
        version: build,
        seat: own.index,
        role: own.role,
        stage: request.publicDiscussion ? 'discussion' : request.councilDiscussion ? 'council' : request.state.stage,
        mission: request.state.mission + 1,
        proposal: request.state.vote + 1,
        choice: request.choices[reply.choice],
        privateReason: reply.privateReason,
        speech: reply.speech,
        request: { ...request, chat: request.chat.slice(-14), humanMemory: undefined },
        ms: Date.now() - started,
      });
      return reply;
    } catch (error) {
      trace.push({ version: build, seat: own.index, role: own.role, stage: request.state.stage, error: String(error) });
      throw error;
    }
  };

  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom(`lab-${Date.now()}`, ids[0], io, logged, undefined, 0, 'en', players);
  // Seeded bot profiles too, so a deal repeats with the same opponents.
  room.players = selectBotAgents((bound) => Math.floor(Math.random() * bound), players).map((agent) => agent.id);
  room.resolvePlayerName = async (id) => names[id];
  if (humans > 1) Object.assign(room.ai!, { withFriend: true, humanSeats: humans });
  room.joinAsHuman(ids[0]);
  for (const id of ids.slice(1)) {
    room.players[room.players.length - 1 - room.humanIDs.length] = id;
    room.ai!.humanPlayerIDs = [...room.humanIDs, id];
  }

  const manager = () => {
    if (room.data.stage !== 'started') throw Error('not started');
    return room.data.manager;
  };
  const nameOf = (id: string) => names[id] ?? getBotProfile(id)?.name ?? id;
  const seatOf = (id: string) => manager().game.players.find((p) => p.userID === id)!.index;
  const idOf = (seat: unknown) => {
    const player = manager().game.players.find((p) => p.index === Number(seat));
    if (!player) throw Error(`There is no seat ${String(seat)}`);
    return player.userID;
  };
  const deal = () =>
    [...manager().game.players]
      .sort((a, b) => a.index - b.index)
      .map((p) => ({
        seat: p.index,
        role: p.role.role,
        id: p.userID,
        name: nameOf(p.userID),
        human: room.isHuman(p.userID),
      }));

  const finished = room.run();
  if (dealOnly) {
    // run() deals synchronously before its first model request.
    console.log(JSON.stringify(deal().filter((p) => p.human)));
    process.exit(0);
  }

  const visible = (id: string) => manager().prepareStateForUser(id) as unknown as VisualGameState;

  function pending(id: string): string | undefined {
    const ai = room.ai!;
    if (room.data.stage !== 'started' || ai.status !== 'running') return;
    const game = room.data.manager.game;
    if (game.stage === 'end') return;
    if (ai.waitingForDiscussion)
      return (ai.discussionPlayerID ?? ai.humanPlayerID) === id
        ? game.stage === 'assassinate'
          ? 'council'
          : 'discussion'
        : undefined;
    if (game.stage === 'selectTeam')
      return game.leader.userID === id && ai.waitingForHuman && !ai.discussionPending ? 'team' : undefined;
    if (!game.players.find((p) => p.userID === id)!.features.waitForAction) return;
    if (game.stage === 'assassinate') return ai.waitingForHuman && !ai.discussionPending ? 'assassinate' : undefined;
    return (
      { votingForTeam: 'vote', onMission: 'mission', checkLoyalty: 'lady', announceLoyalty: 'announce' } as Record<
        string,
        string
      >
    )[game.stage];
  }

  function view(id: string, kind: string, seat: Seat): string {
    const state = visible(id);
    const sorted = [...state.players].sort((a, b) => a.index - b.index);
    const at = (playerID: string) => sorted.find((p) => p.id === playerID)?.index;
    const me = sorted.find((p) => p.id === id)!;
    const lines: string[] = [];
    const { roles, missions } = state.settings;
    const lady = sorted.some((p) => p.features.ladyOfLake);
    lines.push(
      `${sorted.length} players. Good: ${roles.good.map((r) => ROLE[r]).join(', ')}. Evil: ${roles.evil.map((r) => ROLE[r]).join(', ')}.`,
      'Rules: 3 successful missions win for Good unless the Evil assassin then names Merlin; 3 failed missions win for Evil. ' +
        'The 5th proposal of a mission goes on the mission automatically, without a vote.' +
        (lady
          ? ' Lady of the Lake: after missions 2, 3 and 4 its holder inspects a player, then announces the result (may lie).'
          : ''),
      'Seats: ' +
        sorted
          .map(
            (p) =>
              `${p.index} ${p.id === id ? 'YOU' : nameOf(p.id)}${p.id !== id && room.isHuman(p.id) ? ' (human friend)' : ''}`,
          )
          .join(', '),
      `You are seat ${me.index}. Your role: ${ROLE[me.role]} (${EVIL_ROLES.includes(me.role) ? 'Evil' : 'Good'}).`,
    );
    const known = sorted.filter((p) => p.id !== id && p.role !== 'unknown');
    if (known.length)
      lines.push(`What you know: ${known.map((p) => `seat ${p.index} is ${ROLE[p.role] ?? p.role}`).join('; ')}.`);
    if (me.role === 'merlin' && roles.evil.includes('mordred')) lines.push('Mordred is Evil but hidden from you.');
    if (me.role === 'servant') lines.push('You have no secret information.');
    if (EVIL_ROLES.includes(me.role) && me.role !== 'oberon' && roles.evil.includes('oberon'))
      lines.push('Oberon is Evil but unknown to you, and does not know you.');
    if (me.role === 'oberon') lines.push('You do not know the other Evil players and they do not know you.');
    lines.push(
      'Missions: ' +
        missions
          .map((m, index) => {
            const done = state.missionState[index];
            const status = done?.result
              ? `${done.result.toUpperCase()} (${done.fails} fail card${done.fails === 1 ? '' : 's'})`
              : index === state.mission
                ? 'current'
                : 'later';
            return `M${index + 1} ${m.players} players${m.failsRequired > 1 ? `, needs ${m.failsRequired} fails` : ''}: ${status}`;
          })
          .join(' | '),
    );
    const history: string[] = [];
    let mission = 1;
    let attempt = 0;
    for (const event of state.history) {
      if (event.type === 'vote' && event.result) {
        attempt++;
        const head = `M${mission} proposal ${attempt}, leader ${at(event.leaderID)}: [${event.team.map((t) => at(t.id)).join(',')}]`;
        if (event.forced) history.push(`${head} - 5th proposal, sent automatically`);
        else {
          const votes = Array.isArray(event.votes) ? event.votes : [];
          const by = (value: string) =>
            votes
              .filter((v) => v.value === value)
              .map((v) => at(v.playerID))
              .sort((a, b) => a! - b!)
              .join(',');
          history.push(
            `${head} approve ${by('approve') || '-'} / reject ${by('reject') || '-'} -> ${event.result === 'approve' ? 'APPROVED' : 'rejected'}`,
          );
        }
      }
      if (event.type === 'mission' && event.result) {
        history.push(
          `  Mission ${event.index + 1} [${event.actions.map((a) => at(a.playerID)).join(',')}]: ${event.result.toUpperCase()}, ${event.fails} fail card(s)`,
        );
        mission = event.index + 2;
        attempt = 0;
      }
      if (event.type === 'checkLoyalty')
        history.push(`  Lady: ${at(event.validatorID)} inspected ${at(event.inspectedID)}`);
      if (event.type === 'announceLoyalty')
        history.push(
          `  Lady: ${at(event.announcerID)} announced ${at(event.targetID)} is ${String(event.announced).toUpperCase()}`,
        );
    }
    if (history.length) lines.push('History:', ...history.map((line) => `  ${line}`));
    const leaderIndex = sorted.findIndex((p) => p.features.isLeader);
    const order = sorted.map((_, offset) => sorted[(leaderIndex + offset) % sorted.length].index);
    const team = sorted.filter((p) => p.features.isSelected || p.features.isSent).map((p) => p.index);
    const holder = sorted.find((p) => p.features.ladyOfLake === 'has');
    lines.push(
      `Now: mission ${state.mission + 1}, proposal ${state.vote + 1} of 5. Leader ${order[0]}; next leaders ${order.slice(1).join(', ')}.` +
        (team.length && ['votingForTeam', 'onMission'].includes(state.stage)
          ? ` Proposed team: [${team.join(',')}].`
          : '') +
        (holder ? ` Lady of the Lake: seat ${holder.index}.` : ''),
    );
    const chat = room.chat.history.slice(seat.chat).filter((m) => room.players.includes(m.userID));
    seat.chat = room.chat.history.length;
    lines.push(
      chat.length ? 'New chat since your last turn:' : 'No new chat since your last turn.',
      ...chat
        .slice(-40)
        .map((m) =>
          m.userID === id ? `  you: ${m.message}` : `  ${seatOf(m.userID)} ${nameOf(m.userID)}: ${m.message}`,
        ),
    );
    const size = missions[state.mission]?.players;
    const say = '"say": "optional public message"';
    const tasks: Record<string, () => string> = {
      discussion: () =>
        `YOUR TURN TO SPEAK in the table discussion before leader ${order[0]} picks ${size} players for mission ${state.mission + 1}. Answer {"say": "..."} or {"pass": true}.`,
      team: () =>
        `YOU ARE THE LEADER. Pick exactly ${size} seats for mission ${state.mission + 1}. Answer {"team": [seat, ...], ${say}}.`,
      vote: () =>
        `VOTE on team [${team.join(',')}] for mission ${state.mission + 1}. Answer {"vote": "approve" or "reject", ${say}}.` +
        (state.vote === 3 ? ` If this is rejected, seat ${order[1]}'s next proposal goes through automatically.` : ''),
      mission: () =>
        `YOU ARE ON MISSION ${state.mission + 1} (fails needed: ${missions[state.mission]?.failsRequired}). Answer {"card": "success" or "fail"}.`,
      lady: () =>
        `YOU HOLD THE LADY OF THE LAKE. Inspect one seat (${sorted
          .filter((p) => p.id !== id && !p.features.ladyOfLake)
          .map((p) => p.index)
          .join(', ')}). Answer {"target": seat, ${say}}.`,
      announce: () =>
        `LADY RESULT (private): seat ${sorted.find((p) => p.features.isSelected)?.index} is ${String(
          manager().getGameData(id, { method: 'getLoyalty' }),
        ).toUpperCase()}. Announce it publicly; Evil may lie. Answer {"announce": "good" or "evil", ${say}}.`,
      council: () =>
        `EVIL DISCUSSION before the assassin (seat ${sorted.find((p) => p.features.isAssassin)?.index}) names Merlin. Answer {"say": "who you think is Merlin and why"} or {"pass": true}.`,
      assassinate: () =>
        `GOOD WON 3 MISSIONS. YOU ARE THE ASSASSIN: name Merlin (${sorted
          .filter((p) => !EVIL_ROLES.includes(p.role))
          .map((p) => p.index)
          .join(', ')}). Answer {"target": seat, ${say}}.`,
    };
    lines.push(tasks[kind]());
    return lines.join('\n');
  }

  function apply(id: string, kind: string, answer: Answer) {
    const game = manager().game;
    const say = typeof answer.say === 'string' ? answer.say.trim().slice(0, 400) : '';
    const act = (params: TGameMethodsParams) => room.humanAction(id, params);
    // As the chat service does after storing a message: a human line can end the speaking turn.
    const post = (text: string) => room.onChatMessage?.(room.addMessage(id, text));
    const pick = (seat: unknown) => {
      const target = idOf(seat);
      for (const p of game.players.filter((player) => player.features.isSelected))
        act({ method: 'selectPlayer', playerID: p.userID });
      act({ method: 'selectPlayer', playerID: target });
    };
    if (kind === 'discussion' || kind === 'council') {
      if (say) post(say);
      else room.finishDiscussion(id);
      return;
    }
    if (kind === 'team') {
      const size = game.currentMission.data.settings.players;
      if (!Array.isArray(answer.team) || new Set(answer.team).size !== size)
        throw Error(`"team" must list ${size} different seats`);
      const team = answer.team.map(idOf);
      if (say) post(say);
      for (const p of game.players.filter((player) => player.features.isSelected))
        act({ method: 'selectPlayer', playerID: p.userID });
      for (const playerID of team) act({ method: 'selectPlayer', playerID });
      act({ method: 'sentSelectedPlayers' });
      return;
    }
    if (kind === 'vote') {
      if (answer.vote !== 'approve' && answer.vote !== 'reject') throw Error('"vote" must be "approve" or "reject"');
      if (say) post(say);
      return act({ method: 'voteForMission', option: answer.vote });
    }
    if (kind === 'mission') {
      if (answer.card !== 'success' && answer.card !== 'fail') throw Error('"card" must be "success" or "fail"');
      return act({ method: 'actionOnMission', result: answer.card });
    }
    if (kind === 'announce') {
      if (answer.announce !== 'good' && answer.announce !== 'evil') throw Error('"announce" must be "good" or "evil"');
      if (say) post(say);
      return act({ method: 'announceLoyalty', loyalty: answer.announce });
    }
    idOf(answer.target);
    if (say) post(say);
    pick(answer.target);
    act(kind === 'lady' ? { method: 'checkLoyalty' } : { method: 'assassinate', type: 'merlin' });
  }

  function fallback(id: string, kind: string): Answer {
    const state = visible(id);
    const others = state.players.filter((p) => p.id !== id).map((p) => p.index);
    if (kind === 'team')
      return { team: [seatOf(id), ...others].slice(0, manager().game.currentMission.data.settings.players) };
    if (kind === 'lady') return { target: state.players.find((p) => p.id !== id && !p.features.ladyOfLake)!.index };
    if (kind === 'assassinate') return { target: state.players.find((p) => !EVIL_ROLES.includes(p.role))!.index };
    if (kind === 'announce') return { announce: manager().getGameData(id, { method: 'getLoyalty' }) as string };
    return { pass: true, vote: 'approve', card: 'success' };
  }

  const seats = new Map(ids.map((id) => [id, { n: 0, chat: 0, asked: 0 } as Seat]));
  for (const id of ids) {
    mkdirSync(join(dir!, id), { recursive: true });
    for (const file of ['turn.json', 'answered']) rmSync(join(dir!, id, file), { force: true });
  }
  const write = (id: string, turn: object) => {
    const file = join(dir!, id, 'turn.json');
    writeFileSync(`${file}.tmp`, JSON.stringify(turn, null, 1));
    renameSync(`${file}.tmp`, file);
  };
  const issue = (id: string, kind: string, note?: string) => {
    const seat = seats.get(id)!;
    seat.n++;
    seat.asked = Date.now();
    const text = (note ? `NOTE: ${note}\n` : '') + view(id, kind, seat);
    write(id, { n: seat.n, kind, text });
    console.log(`[turn] ${names[id]} #${seat.n} ${kind}`);
  };
  const answer = (id: string, kind: string, reply: Answer, source: string) => {
    const seat = seats.get(id)!;
    const started = seat.asked;
    try {
      apply(id, kind, reply);
      seat.answered = seat.n;
      seat.answeredAt = Date.now();
      humanTrace.push({ seat: seatOf(id), id, n: seat.n, kind, answer: reply, source, ms: Date.now() - started });
      console.log(`[answer] ${names[id]} #${seat.n} ${kind} ${JSON.stringify(reply)}`);
    } catch (error) {
      humanTrace.push({ seat: seatOf(id), id, n: seat.n, kind, answer: reply, source, error: String(error) });
      issue(id, kind, `your last answer was rejected: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const poll = () => {
    for (const id of ids) {
      const seat = seats.get(id)!;
      const kind = pending(id);
      if (!kind) {
        seat.key = undefined;
        continue;
      }
      const state = visible(id);
      const key = `${kind}|${state.stage}|${state.mission}|${state.vote}|${state.history.length}`;
      if (kind === 'mission') {
        const own = state.players.find((p) => p.id === id)!;
        if ((own.validMissionsResult || []).length === 1) {
          if (seat.key !== key) answer(id, kind, { card: own.validMissionsResult![0] }, 'automatic');
          seat.key = key;
          continue;
        }
      }
      if (seat.key !== key) {
        seat.key = key;
        issue(id, kind);
        continue;
      }
      const file = join(dir!, id, `answer-${seat.n}.json`);
      if (seat.answered !== seat.n && existsSync(file)) {
        let reply: Answer;
        try {
          reply = JSON.parse(readFileSync(file, 'utf8')) as Answer;
        } catch {
          reply = {};
        }
        rmSync(file, { force: true });
        answer(id, kind, reply, 'player');
      } else if (seat.answered !== seat.n && Date.now() - seat.asked > turnLimitMs) {
        answer(id, kind, fallback(id, kind), 'timeout');
      } else if (seat.answered === seat.n && Date.now() - seat.answeredAt! > 3000) {
        issue(id, kind, 'your answer did not complete the action; it is still your turn.');
      }
    }
  };
  const timer = setInterval(() => {
    try {
      poll();
    } catch (error) {
      console.error('poll failed:', error);
    }
  }, 300);

  await finished;
  for (let attempt = 0; attempt < 3 && room.ai?.status === 'paused' && room.ai.canResumeTechnical; attempt++) {
    console.error('resuming after pause:', room.ai.message);
    await room.run(true);
  }
  clearInterval(timer);

  const state = room.calculateRoomState();
  const game = state.stage === 'started' ? state.game : undefined;
  const table = deal();
  const summary = {
    bots: build,
    evilBots,
    seed: process.env.AI_LAB_SEED,
    status: room.ai?.status,
    message: room.ai?.message,
    result: game?.result,
    roles: game?.players.map((p) => [p.index, p.role]),
    humans: table.filter((p) => p.human).map((p) => [p.seat, p.role, names[p.id]]),
    seats: table.map((p) => [p.seat, p.id]),
    missions: game?.history
      .filter((e) => e.type === 'mission')
      .map((e) => (e.type === 'mission' ? { n: e.index + 1, result: e.result, fails: e.fails } : null)),
    assassination: game?.history.filter((e) => e.type === 'assassinate'),
    decisions: trace.length,
    calls,
    humanTurns: humanTrace.length,
    timeouts: humanTrace.filter((t) => t.source === 'timeout').length,
  };
  const label = (id: string) =>
    `${table.find((p) => p.id === id)?.seat ?? '?'}${room.isHuman(id) ? ` ${names[id]}` : ''}`;
  const chat = room.chat.history.map((m) => `${label(m.userID)}: ${m.message}`);
  for (const id of ids) {
    const seat = seats.get(id)!;
    write(id, {
      n: seat.n + 1,
      done: true,
      text:
        `GAME OVER: ${game?.result?.winner} wins (${game?.result?.reason}).\n` +
        `Roles: ${table.map((p) => `${p.seat} ${p.human ? names[p.id] : p.name} = ${ROLE[p.role]}`).join('; ')}\n` +
        `Missions: ${summary.missions?.map((m) => m?.result).join(', ')}`,
    });
  }
  if (out) writeFileSync(out, JSON.stringify({ summary, trace, humanTrace, chat, history: game?.history }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
