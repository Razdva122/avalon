const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Loading the decision helper must not connect to production or install timers.
function loadGuard() {
  const context = {
    module: { exports: {} },
    require() {
      assert.fail('Importing the idle guard must not load a socket client');
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'check-idle.cjs'), 'utf8'), context);
  assert.equal(typeof context.module.exports.checkIdle, 'function');
  return context.module.exports.checkIdle;
}
const completed = (overrides = {}) => ({
  uuid: 'finished-room',
  hostID: 'host',
  state: 'started',
  players: 7,
  createAt: '2026-09-26T00:00:00.000Z',
  startAt: '2026-09-26T00:01:00.000Z',
  options: { roles: {}, addons: {}, features: {} },
  result: { winner: 'good', reason: 'goodTeamMissions' },
  ...overrides,
});

test('importing the guard is side-effect free', () => {
  loadGuard();
});
test('an empty list or fewer than 20 completed rooms permits activation', () => {
  const checkIdle = loadGuard();
  assert.equal(checkIdle([]).exitCode, 0);
  assert.equal(checkIdle(Array.from({ length: 19 }, (_, i) => completed({ uuid: String(i) }))).exitCode, 0);
});
test('20 completed rooms cannot prove that older active rooms are absent', () => {
  const checkIdle = loadGuard();
  for (const length of [20, 21]) {
    assert.equal(checkIdle(Array.from({ length }, (_, i) => completed({ uuid: String(i) }))).exitCode, 2);
  }
});
test('unfinished games and waiting rooms block activation', () => {
  const checkIdle = loadGuard();
  for (const state of ['created', 'locked', 'started']) {
    const decision = checkIdle([completed(), completed({ uuid: 'active-room', state, result: undefined })]);
    assert.equal(decision.exitCode, 3);
    assert.equal(decision.activeRooms[0].id, 'active-room');
  }
});
test('malformed response and entries fail closed', () => {
  const checkIdle = loadGuard();
  for (const value of [
    undefined,
    null,
    {},
    '[]',
    [null],
    [true],
    [{}],
    [completed({ uuid: '' })],
    [completed({ state: 'unknown' })],
    [completed({ players: -1 })],
    [completed({ players: '7' })],
    [completed({ result: true })],
    [completed({ result: {} })],
    [completed({ result: { reason: 'unknown' } })],
    [completed({ state: 'created' })],
  ]) {
    assert.equal(checkIdle(value).exitCode, 2, JSON.stringify(value));
  }
});
