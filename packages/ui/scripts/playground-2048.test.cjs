const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const file = require('node:path').join(__dirname, '../src/components/playground/game2048.ts');
const game = {};
if (fs.existsSync(file)) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', code)(game);
}
const tiles = (values) =>
  values.flatMap((row, r) => row.flatMap((value, c) => (value ? [{ id: r * 4 + c + 1, value, row: r, col: c }] : [])));
const values = (items) =>
  Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 4 }, (_, c) => items.find((t) => t.row === r && t.col === c)?.value || 0),
  );
const state = (rows) => ({ tiles: tiles(rows), score: 0, best: 0, nextID: 17, continued: false });

test('2048 merges each tile once, scores both pairs and preserves slide paths', () => {
  assert.equal(typeof game.moveTiles, 'function');
  const result = game.moveTiles(state([[2, 2, 2, 2]]), 'left');
  assert.deepEqual(values(result.state.tiles)[0], [4, 4, 0, 0]);
  assert.equal(result.state.score, 8);
  assert.equal(result.state.best, 8);
  assert.equal(result.sliding.find((t) => t.id === 4).col, 1);
  assert.equal(new Set(result.state.tiles.map((t) => t.id)).size, 2);
});

test('2048 handles all directions and does not spawn or score on a blocked move', () => {
  for (const [direction, rows, expected] of [
    ['right', [[2, 2, 4, 0]], [[0, 0, 4, 4]]],
    ['up', [[2], [2], [4]], [[4], [4]]],
    ['down', [[2], [2], [4]], [[0], [0], [4], [4]]],
  ]) {
    const result = game.moveTiles(state(rows), direction);
    for (let r = 0; r < expected.length; r++)
      expected[r].forEach((value, c) => assert.equal(values(result.state.tiles)[r][c], value));
  }
  const source = state([[2, 4, 8, 16]]);
  const result = game.moveTiles(source, 'left');
  assert.equal(result.changed, false);
  assert.deepEqual(result.state, source);
  assert.deepEqual(source.tiles, tiles([[2, 4, 8, 16]]));
});

test('new games and spawns use empty cells and unique IDs, including random boundaries', () => {
  const fresh = game.createGame(100, () => 0);
  assert.equal(fresh.tiles.length, 2);
  assert.equal(fresh.best, 100);
  assert.equal(new Set(fresh.tiles.map((t) => `${t.row},${t.col}`)).size, 2);
  const full = state([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ]);
  assert.deepEqual(game.spawnTile(full), full);
  const one = game.spawnTile(state([[2]]), () => 0.99);
  assert.equal(one.tiles.at(-1).value, 4);
  assert.deepEqual([one.tiles.at(-1).row, one.tiles.at(-1).col], [3, 3]);
});

test('game over checks horizontal and vertical neighbours on a full board', () => {
  const full = state([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ]);
  assert.equal(game.canMove(full.tiles), false);
  full.tiles[0].value = 4;
  assert.equal(game.canMove(full.tiles), true);
  assert.equal(game.canMove([]), true);
});

test('local saves round-trip and reject invalid, duplicate or incompatible board data', () => {
  const original = game.createGame(400, () => 0);
  const saved = JSON.stringify({ version: 1, ...original });
  assert.deepEqual(game.parseSaved(saved), original);
  for (const raw of [
    'null',
    '{',
    '{}',
    JSON.stringify({ ...original, version: 2 }),
    JSON.stringify({ ...original, version: 1, tiles: [original.tiles[0], original.tiles[0]] }),
    JSON.stringify({ ...original, version: 1, tiles: [{ id: 1, value: 3, row: 0, col: 0 }] }),
    JSON.stringify({ ...original, version: 1, score: -1 }),
    JSON.stringify({ ...original, version: 1, tiles: [] }),
  ])
    assert.equal(game.parseSaved(raw), null);
  const blocked = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('quota');
    },
  };
  assert.equal(game.loadGame(blocked), null);
  assert.equal(game.saveGame(blocked, original), false);
});

test('swipes ignore taps and ambiguous diagonal gestures and resolve a single dominant axis', () => {
  assert.equal(game.swipeDirection(10, 2, 24), null);
  assert.equal(game.swipeDirection(40, 38, 24), null);
  assert.equal(game.swipeDirection(-60, 12, 24), 'left');
  assert.equal(game.swipeDirection(60, 12, 24), 'right');
  assert.equal(game.swipeDirection(8, -50, 24), 'up');
  assert.equal(game.swipeDirection(8, 50, 24), 'down');
});
