const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
function panel() {
  const sent = [];
  const source = fs
    .readFileSync(require.resolve('../src/components/view/panels/HostPanel.vue'), 'utf8')
    .match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === 'vue') return vue;
    if (id === 'vuetify') return { useDisplay: () => ({ smAndDown: vue.ref(false) }) };
    if (id === '@/api/socket') return { socket: { emit: (...args) => sent.push(args) } };
    if (id.endsWith('/room-options'))
      return { useRoomOptions: (source, publish) => ({ options: vue.ref(source()), applyOptions: publish }) };
    return {};
  }, exports);
  const props = vue.reactive({
    roomState: {
      roomID: 'room',
      stage: 'created',
      players: Array.from({ length: 5 }, (_, i) => ({ id: String(i) })),
      options: {},
    },
    gameEnded: false,
  });
  const scope = vue.effectScope();
  const state = scope.run(() => exports.default.setup(props));
  return { props, state, sent, stop: () => scope.stop() };
}
test('host cannot start before locking or with an invalid player count', () => {
  const p = panel();
  p.state.startGame();
  assert.equal(p.sent.length, 0);
  p.props.roomState.stage = 'locked';
  p.state.startGame();
  assert.deepEqual(p.sent, [['startGame', 'room']]);
  p.props.roomState.players = [];
  p.state.startGame();
  assert.equal(p.sent.length, 1);
  p.stop();
});
test('confirmation launches the existing vote and blocks stale or overlapping votes', () => {
  const p = panel();
  p.props.roomState.stage = 'started';
  p.state.confirmAction();
  assert.equal(p.sent.length, 0);
  p.state.confirmation.value = 'endGame';
  p.props.roomState.vote = {};
  p.state.confirmAction();
  assert.equal(p.sent.length, 0);
  delete p.props.roomState.vote;
  p.props.gameEnded = true;
  p.state.confirmAction();
  assert.equal(p.sent.length, 0);
  p.props.gameEnded = false;
  p.state.confirmAction();
  assert.deepEqual(p.sent, [['endGame', 'room']]);
  p.stop();
});
test('room changes discard confirmation and game start blocks lobby edits', async () => {
  const p = panel();
  p.state.open.value = true;
  await vue.nextTick();
  p.state.confirmation.value = 'endGame';
  p.props.roomState.stage = 'started';
  await vue.nextTick();
  assert.equal(p.state.confirmation.value, null);
  p.state.emitAction('shuffle');
  p.state.emitAction('lockRoom');
  p.state.applyOptions({ roles: {} });
  assert.equal(p.sent.length, 0);
  p.stop();
});
