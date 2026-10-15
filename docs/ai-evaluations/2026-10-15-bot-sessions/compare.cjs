// Default: complete two deterministic engine games without model calls.
// --run: two real games, using ChatGPT authentication from the current profile.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
process.env.TS_NODE_PROJECT = path.join(root, 'packages/backend/tsconfig.json');
require(path.join(root, 'node_modules/ts-node')).register({
  project: process.env.TS_NODE_PROJECT,
  transpileOnly: true,
});
const _ = require('lodash');
const { BotRoom } = require(path.join(root, 'packages/backend/src/ai/room'));
const { BOT_AGENTS } = require(path.join(root, 'packages/backend/src/ai/agents'));
const { codexDecide, runCodex, experimentalCodexSessionRunner } = require(
  path.join(root, 'packages/backend/src/ai/codex'),
);
const { decisionPipeline } = require(path.join(root, 'packages/backend/src/ai/pipeline'));
const { readCodexWeeklyLimit } = require(path.join(root, 'packages/backend/src/ai/codex-limits'));
const live = process.argv.includes('--run');
const sessionInputMode = process.argv.includes('--session-deltas') ? 'delta' : 'snapshot';
const outputDir = sessionInputMode === 'delta' ? path.join(__dirname, '../2026-10-15-session-deltas') : __dirname;
const settings = { model: 'gpt-6.1-sol', reasoning: 'medium' };
const report = { live, settings, sessionInputMode, seed: 20261015, language: 'ru', playerCount: 5, games: [] };
const destination = path.join(
  outputDir,
  live ? (sessionInputMode === 'delta' ? 'live-results.json' : 'results.json') : 'dry-run.json',
);
const save = () => fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
const io = { to: () => io, except: () => io, emit: () => true };
let activeRoom;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    report.interrupted = signal;
    activeRoom?.stop('Evaluation interrupted.');
  });

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function summary(calls) {
  const result = {
    calls: calls.length,
    input: 0,
    cached: 0,
    uncached: 0,
    output: 0,
    reasoning: 0,
    cacheHits: 0,
    elapsedMs: 0,
  };
  for (const call of calls) {
    const u = call.usage || {};
    result.input += u.input_tokens || 0;
    result.cached += u.cached_input_tokens || 0;
    result.output += u.output_tokens || 0;
    result.reasoning += u.reasoning_output_tokens || 0;
    result.cacheHits += Number((u.cached_input_tokens || 0) > 0);
    result.elapsedMs += call.elapsedMs || 0;
  }
  result.uncached = result.input - result.cached;
  return result;
}

async function play(mode, home) {
  const game = {
    mode,
    startedAt: new Date().toISOString(),
    calls: [],
    requests: [],
    decisions: [],
    errors: [],
    checkpoints: 0,
  };
  report.games.push(game);
  const sessions = new Map();
  const requestMap = new Map();
  const traceFile = path.join(outputDir, `${mode}-traces.jsonl`);
  if (live) fs.writeFileSync(traceFile, '');
  const repository = {
    renewLease: async () => {},
    recordRequest: async (entry) => {
      requestMap.set(entry._id, structuredClone(entry));
      game.requests = [...requestMap.values()];
      save();
    },
    recordDecision: async (entry) => {
      if (entry.output !== undefined) fs.appendFileSync(traceFile, JSON.stringify(entry) + '\n');
    },
  };
  let room;
  const provider = async (request, options, signal) => {
    if (!game.initial) {
      game.initial = room.data.manager.game.players.map((p) => ({ id: p.userID, seat: p.index, role: p.role.role }));
      save();
    }
    // Conclusions happen after the game. Both arms use fresh sessions for these
    // five reviews, so in-game confidentiality instructions do not outlive play.
    const inGame = request.state.stage !== 'end';
    if (mode === 'per-bot' && inGame && !sessions.has(request.playerID))
      sessions.set(request.playerID, experimentalCodexSessionRunner(home, sessionInputMode));
    const runner = mode === 'per-bot' && inGame ? sessions.get(request.playerID) : runCodex;
    return codexDecide(
      mode,
      repository,
      async (...args) => {
        assert.ok(game.calls.length < 450, 'Generation safety ceiling reached');
        const call = {
          n: game.calls.length + 1,
          player: request.playerID,
          seat: request.name,
          stage: request.state.stage,
          mission: request.state.mission + 1,
          task: request.task,
          phase: options.phase,
          startedAt: new Date().toISOString(),
        };
        game.calls.push(call);
        save();
        const started = Date.now();
        try {
          const result = await runner(...args);
          call.usage = result.usage;
          call.submittedInputBytes = Buffer.byteLength(
            result.sessionInput ?? (args[4] ? args[0].slice(args[4].length) : args[0]),
          );
          call.output = result.text;
          return result;
        } catch (error) {
          call.error = error.message;
          throw error;
        } finally {
          call.elapsedMs = Date.now() - started;
          game.playUsage = summary(game.calls.filter((c) => c.stage !== 'end'));
          game.reviewUsage = summary(game.calls.filter((c) => c.stage === 'end'));
          save();
          console.log(
            `${mode} #${call.n} mission=${call.mission} ${call.stage} seat=${call.seat} input=${call.usage?.input_tokens ?? '?'} cached=${call.usage?.cached_input_tokens ?? '?'} ${call.error || 'ok'}`,
          );
        }
      },
      () => settings,
    )(request, options, signal);
  };
  const pipeline = decisionPipeline(provider);
  const decide = live
    ? async (request, signal) => {
        const reply = await pipeline(request, signal);
        game.decisions.push({
          player: request.playerID,
          seat: request.name,
          stage: request.state.stage,
          mission: request.state.mission + 1,
          task: request.task,
          choice: request.choices[reply.choice],
          privateReason: reply.privateReason,
          speech: reply.speech,
          evidence: reply.evidence,
        });
        save();
        return reply;
      }
    : async (request) => {
        if (!game.initial)
          game.initial = room.data.manager.game.players.map((p) => ({
            id: p.userID,
            seat: p.index,
            role: p.role.role,
          }));
        return {
          choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0,
          speech: request.speak ? 'Предлагаю проверить этот состав.' : '',
        };
      };
  room = new BotRoom(
    `session-evaluation-${mode}`,
    'evaluation',
    io,
    decide,
    async () => {
      game.checkpoints++;
      game.state = room.data.manager.prepareStateForUser();
      game.ai = room.ai;
      game.chat = room.chat.history;
      save();
    },
    0,
    report.language,
    report.playerCount,
    0,
  );
  room.players = BOT_AGENTS.slice(0, report.playerCount).map((a) => a.id);
  room.ai.codexSettings = settings;
  const random = seededRandom(report.seed);
  const original = { shuffle: _.shuffle, sample: _.sample };
  _.shuffle = (values) => {
    const array = [...values];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  _.sample = (values) => values[Math.floor(random() * values.length)];
  if (live) game.quotaBefore = await readCodexWeeklyLimit().catch(() => null);
  try {
    if (report.interrupted) throw new Error('Evaluation interrupted before game start');
    activeRoom = room;
    await room.run();
    // Retrying a paused match never applies the rejected decision. Keep every
    // pause in the quality report; do not change prompts or substitute moves.
    game.pauses = [];
    for (let attempt = 0; live && attempt < 2 && room.ai.canResumeTechnical && !report.interrupted; attempt++) {
      game.pauses.push({ message: room.ai.message, afterCalls: game.calls.length });
      if (/usage limit|busy or failed/i.test(room.ai.message)) break;
      await room.run(true);
    }
    if (room.ai.status === 'paused' && game.pauses.at(-1)?.afterCalls !== game.calls.length)
      game.pauses.push({ message: room.ai.message, afterCalls: game.calls.length });
    game.status = room.ai.status;
    game.message = room.ai.message;
    game.result = room.data.manager.game.result;
    game.sessionCount = sessions.size;
    if (room.ai.status !== 'finished') game.errors.push(room.ai.message);
  } finally {
    activeRoom = undefined;
    Object.assign(_, original);
    game.finishedAt = new Date().toISOString();
    game.wallMs = Date.parse(game.finishedAt) - Date.parse(game.startedAt);
    if (live) game.quotaAfter = await readCodexWeeklyLimit().catch(() => null);
    save();
  }
}

async function main() {
  if (live && fs.existsSync(destination))
    throw new Error('Live results already exist. Preserve them before rerunning.');
  let home;
  try {
    if (live) {
      if (process.env.AI_CODEX_SSH_HOST) throw new Error('Use local Codex for this experiment');
      const authHome = process.env.AI_CODEX_HOME || process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
      home = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-session-evaluation-'));
      fs.chmodSync(home, 0o700);
      fs.mkdirSync(path.join(home, 'work'));
      fs.symlinkSync(path.join(authHome, 'auth.json'), path.join(home, 'auth.json'));
      process.env.AI_CODEX_HOME = home;
      process.env.AI_CODEX_ENABLED = 'true';
      process.env.NODE_ENV = 'development';
    }
    await play('fresh', home);
    if (report.games[0].status !== 'finished')
      throw new Error('Fresh game paused; inspect results before starting the other arm');
    if (report.interrupted) throw new Error('Evaluation interrupted before session game');
    await play('per-bot', home);
    assert.deepEqual(report.games[0].initial, report.games[1].initial);
    if (report.games[1].status !== 'finished') throw new Error('Session game paused; inspect results');
    console.log(
      JSON.stringify(
        report.games.map(({ mode, status, result, playUsage, reviewUsage }) => ({
          mode,
          status,
          result,
          playUsage,
          reviewUsage,
        })),
        null,
        2,
      ),
    );
  } finally {
    if (home) fs.rmSync(home, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
