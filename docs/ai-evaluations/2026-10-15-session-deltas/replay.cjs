// No inference: reconstruct every original snapshot and instruction exactly.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
process.env.TS_NODE_PROJECT = path.join(root, 'packages/backend/tsconfig.json');
require(path.join(root, 'node_modules/ts-node')).register({
  project: process.env.TS_NODE_PROJECT,
  transpileOnly: true,
});
const { buildCodexPrompt } = require(path.join(root, 'packages/backend/src/ai/codex'));
const { decisionInstructions } = require(path.join(root, 'packages/backend/src/ai/pipeline'));
const { createSessionInput } = require(path.join(root, 'packages/backend/src/ai/session-input'));
const baseline = buildCodexPrompt('', {}).instructions;
const boundary = baseline.indexOf('\nUse claimMorgana=');
assert.ok(boundary > 0);
const header = baseline.slice(0, boundary);
const guide = baseline.slice(boundary);
const common = decisionInstructions({ language: 'ru', state: { stage: 'selectTeam', history: [] } }, true);
const bytes = (s) => Buffer.byteLength(s);
const results = [];
for (const mode of ['fresh', 'per-bot']) {
  const source = path.join(__dirname, `../2026-10-15-bot-sessions/${mode}-traces.jsonl`);
  const traces = fs
    .readFileSync(source, 'utf8')
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter((t) => t.stage !== 'end');
  const players = new Map();
  const result = {
    sourceMode: mode,
    calls: traces.length,
    originalUserBytes: 0,
    deltaUserBytes: 0,
    originalIntroducedBytes: 0,
    deltaIntroducedBytes: 0,
    exactSnapshots: 0,
    exactInstructions: 0,
    updates: [],
  };
  for (const trace of traces) {
    assert.ok(trace.payload.instructions.startsWith(common));
    const built = buildCodexPrompt(trace.payload.instructions, trace.payload.context, common);
    let player = players.get(trace.player);
    if (!player) {
      player = { encode: createSessionInput(guide, header), state: {}, rules: '', common: '' };
      players.set(trace.player, player);
      result.originalIntroducedBytes += bytes(built.instructions);
    }
    const update = player.encode(built.prompt, built.instructions);
    const message = JSON.parse(update.message);
    if (message.turn === 1) result.deltaIntroducedBytes += bytes(update.instructions);
    if (message.rules !== undefined) player.rules = message.rules;
    if (message.commonRules !== undefined) player.common = message.commonRules;
    for (const key of message.state.remove || []) delete player.state[key];
    Object.assign(player.state, message.state.set);
    for (const [key, patch] of Object.entries(message.state.arrays || {})) {
      assert.ok(Array.isArray(player.state[key]));
      assert.ok(Number.isInteger(patch.drop) && patch.drop >= 0 && patch.drop <= player.state[key].length);
      player.state[key] = player.state[key].slice(patch.drop).concat(patch.append);
    }
    assert.deepEqual(player.state, trace.payload.context);
    assert.equal(
      header + player.common + player.rules + guide,
      built.prompt.slice(0, built.prompt.indexOf('\nGAME INPUT:\n')),
    );
    result.exactSnapshots++;
    result.exactInstructions++;
    const originalBytes = bytes(built.prompt.slice(built.instructions.length));
    const deltaBytes = bytes('\nSESSION INPUT:\n' + update.message);
    result.originalUserBytes += originalBytes;
    result.deltaUserBytes += deltaBytes;
    result.originalIntroducedBytes += originalBytes;
    result.deltaIntroducedBytes += deltaBytes;
    result.updates.push({
      player: trace.player,
      stage: trace.stage,
      turn: message.turn,
      originalBytes,
      deltaBytes,
      set: Object.keys(message.state.set || {}),
      removed: message.state.remove || [],
      arrays: Object.keys(message.state.arrays || {}),
      rulesUpdated: message.rules !== undefined,
      commonUpdated: message.commonRules !== undefined,
    });
  }
  result.players = players.size;
  result.userBytesReduction = 1 - result.deltaUserBytes / result.originalUserBytes;
  result.introducedBytesReduction = 1 - result.deltaIntroducedBytes / result.originalIntroducedBytes;
  results.push(result);
}
fs.writeFileSync(
  path.join(__dirname, 'results.json'),
  JSON.stringify(
    {
      inferenceCalls: 0,
      measurement: 'UTF-8 bytes of newly submitted text; not API input tokens or subscription quota',
      results,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    results.map(({ updates, ...result }) => result),
    null,
    2,
  ),
);
