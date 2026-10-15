// Verify the updates actually submitted to Codex, rather than regenerating them.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'live-results.json'), 'utf8'));
const tracePath = path.join(__dirname, 'per-bot-traces.jsonl');
const traces = fs.existsSync(tracePath)
  ? fs
      .readFileSync(tracePath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(JSON.parse)
      .filter((t) => t.stage !== 'end')
  : [];
const players = new Map();
let submittedBytes = 0;
for (const trace of traces) {
  const wire = trace.payload.sessionInput;
  const marker = '\nSESSION INPUT:\n';
  assert.ok(typeof wire === 'string' && wire.startsWith(marker), 'Missing actual session input');
  const update = JSON.parse(wire.slice(marker.length));
  const player = players.get(trace.player) || { state: {}, turn: 0 };
  assert.equal(update.turn, player.turn + 1, 'Missing or reordered player update');
  player.turn = update.turn;
  if (update.commonRules !== undefined) player.common = update.commonRules;
  if (update.rules !== undefined) player.rules = update.rules;
  for (const key of update.state.remove || []) delete player.state[key];
  Object.assign(player.state, update.state.set);
  for (const [key, patch] of Object.entries(update.state.arrays || {})) {
    assert.ok(Array.isArray(player.state[key]));
    assert.ok(Number.isInteger(patch.drop) && patch.drop >= 0 && patch.drop <= player.state[key].length);
    player.state[key] = player.state[key].slice(patch.drop).concat(patch.append);
  }
  assert.deepEqual(player.state, trace.payload.context, 'Submitted updates lost or changed state');
  assert.equal(player.common + player.rules, trace.payload.instructions, 'Submitted updates changed instructions');
  const assignment = report.games.find((g) => g.mode === 'per-bot').initial.find((p) => p.id === trace.player);
  assert.equal(player.state.you.seat, assignment.seat);
  assert.equal(player.state.you.role, assignment.role);
  players.set(trace.player, player);
  submittedBytes += Buffer.byteLength(wire);
}
const game = report.games.find((g) => g.mode === 'per-bot');
if (game?.status === 'finished') {
  assert.equal(players.size, 5);
  assert.equal(traces.length, game.calls.filter((c) => c.stage !== 'end').length);
  assert.equal(
    submittedBytes,
    game.calls.filter((c) => c.stage !== 'end').reduce((n, c) => n + c.submittedInputBytes, 0),
  );
}
const result = {
  complete: game?.status === 'finished',
  checkedTurns: traces.length,
  players: players.size,
  exactSnapshots: traces.length,
  exactInstructions: traces.length,
  submittedBytes,
};
fs.writeFileSync(path.join(__dirname, 'live-input-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
