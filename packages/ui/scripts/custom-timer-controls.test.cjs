const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function controls() {
  const sent = [];
  const game = vue.ref({
    stage: 'selectTeam',
    timer: { active: true, isCustom: true, playerID: 'bob', durationSeconds: 120 },
    players: [
      { id: 'bob', index: 1 },
      { id: 'alice', index: 0 },
    ],
  });
  const store = vue.reactive({
    state: {
      profile: { id: 'alice' },
      users: {
        alice: { status: 'ready', profile: { name: 'Alice' } },
        bob: { status: 'ready', profile: { name: 'Bob' } },
      },
    },
  });
  const viewMode = vue.ref('live');
  const source = fs
    .readFileSync(require.resolve('../src/components/view/board/modules/CustomTimerControls.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const exports = {};
  new Function(
    'require',
    'exports',
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )((id) => {
    if (id === 'vue') return { ...vue, inject: (key) => (key === 'game' ? game : { viewMode }) };
    if (id === '@/store') return { useStore: () => store };
    if (id === '@/api/socket') return { socket: { emit: (...args) => sent.push(args) } };
    if (id === '@/helpers/game-state-manager') return { gameStateKey: 'game', stateManagerKey: 'manager' };
    return {};
  }, exports);
  const props = vue.reactive({ roomID: 'room', leaderID: 'alice' });
  const state = exports.default.setup(props);
  return { state, sent, props, game, viewMode };
}

test('host selects, unbinds and advances via server; displayed options follow seat order', () => {
  const t = controls();
  assert.deepEqual(t.state.timerPlayers.value, [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ]);
  t.state.setTimerPlayer({ target: { value: 'alice' } });
  t.state.nextPlayer();
  t.state.setTimerPlayer({ target: { value: '' } });
  assert.deepEqual(t.sent, [
    ['setCustomTimerPlayer', 'room', 'alice'],
    ['nextCustomTimerPlayer', 'room'],
    ['setCustomTimerPlayer', 'room', null],
  ]);
  assert.equal(t.game.value.timer.playerID, 'bob'); // Changes wait for authoritative state.
});

test('non-hosts, history views and unbound timers cannot advance a turn', () => {
  const t = controls();
  t.props.leaderID = 'bob';
  t.state.setTimerPlayer({ target: { value: 'alice' } });
  t.state.nextPlayer();
  t.props.leaderID = 'alice';
  t.viewMode.value = 'history';
  t.state.setTimerPlayer({ target: { value: 'alice' } });
  t.state.nextPlayer();
  t.viewMode.value = 'live';
  delete t.game.value.timer.playerID;
  t.state.nextPlayer();
  assert.deepEqual(t.sent, []);
});

test('next player preview wraps through seat order and starting uses the shared duration', () => {
  const t = controls();
  assert.equal(t.state.nextTimerPlayer.value.name, 'Alice');
  t.state.startTimer();
  assert.deepEqual(t.sent, [['startCustomTimer', 'room']]);
  t.game.value.timer.playerID = 'alice';
  assert.equal(t.state.nextTimerPlayer.value.name, 'Bob');
});

test('preset changes do not start a countdown and adding time requires a running turn', () => {
  const t = controls();
  t.state.setDuration(300);
  t.state.addMinutes(1);
  assert.deepEqual(t.sent, [
    ['setCustomTimerDuration', 'room', 300],
    ['addCustomTimerTime', 'room', 60],
  ]);
  t.game.value.timer.active = false;
  t.state.addMinutes(1);
  t.state.setDuration(0);
  t.state.setDuration(1.5);
  assert.equal(t.sent.length, 2);
  t.viewMode.value = 'history';
  t.state.setDuration(60);
  t.state.startTimer();
  t.state.stopTimer();
  assert.equal(t.sent.length, 2);
});

test('starting immediately after a duration edit uses the server setting instead of stale local state', () => {
  const t = controls();
  t.state.setDuration(300);
  t.state.startTimer();
  assert.deepEqual(t.sent, [
    ['setCustomTimerDuration', 'room', 300],
    ['startCustomTimer', 'room'],
  ]);
});

test('custom input preserves typed digits while older server updates arrive', async () => {
  const t = controls();
  t.state.onCustomDurationChange({ target: { value: '75' } });
  assert.equal(t.state.customDurationDraft.value, 75);
  assert.deepEqual(t.sent, [['setCustomTimerDuration', 'room', 75]]);
  t.game.value.timer.durationSeconds = 7;
  await vue.nextTick();
  assert.equal(t.state.customDurationDraft.value, 75);
  t.game.value.timer.durationSeconds = 75;
  await vue.nextTick();
  t.game.value.timer.durationSeconds = 90;
  await vue.nextTick();
  assert.equal(t.state.customDurationDraft.value, 90);
});

test('invalid custom duration cannot start or advance a turn', () => {
  const t = controls();
  t.state.setDuration(0);
  t.state.startTimer();
  t.state.nextPlayer();
  assert.deepEqual(t.sent, []);
  t.state.setDuration(120);
  t.state.startTimer();
  assert.deepEqual(t.sent, [
    ['setCustomTimerDuration', 'room', 120],
    ['startCustomTimer', 'room'],
  ]);
});
