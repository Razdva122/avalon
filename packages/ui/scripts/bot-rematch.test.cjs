const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');

async function fixture(reply = async () => ({ roomID: 'next' })) {
  const filename = path.resolve(__dirname, '../src/components/view/board/modules/BotRematchButton.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: 'rematch-test' }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const access = {
    canPlay: vue.ref(true),
    canPlayLargeTables: vue.ref(false),
    accessStatus: vue.ref('ready'),
    botModes: vue.ref({ regular: true, beginner: true }),
    botsBusy: vue.ref(false),
    ownRoomID: vue.ref(),
    refresh: async () => {},
  };
  const store = vue.reactive({ state: { profile: { id: 'owner' } } });
  const props = vue.reactive({
    room: {
      roomID: 'old',
      leaderID: 'owner',
      stage: 'started',
      ai: { humanPlayerID: 'owner', publicBotGame: true, status: 'finished' },
      game: { stage: 'end' },
    },
  });
  const calls = [],
    routes = [],
    cleanup = [];
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (id) => {
      if (id === 'vue') return { ...vue, onBeforeUnmount: (fn) => cleanup.push(fn) };
      if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
      if (id === 'vue-router') return { useRouter: () => ({}) };
      if (id === '@avalon/types/room/lobby-ai') {
        const exports = {};
        new Function(
          'exports',
          ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../types/room/lobby-ai.ts'), 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS },
          }).outputText,
        )(exports);
        return exports;
      }
      if (id === '@/store') return { useStore: () => store };
      if (id === '@/helpers/composables/useAiAccess') return { useAiAccess: () => access };
      if (id === '@/helpers/open-room-route')
        return {
          openRoomRoute: async (_router, roomID, active) => {
            if (!active()) return false;
            routes.push(roomID);
            return true;
          },
        };
      if (id === '@/api/socket')
        return {
          socket: {
            timeout: () => ({
              emitWithAck: async (...args) => {
                calls.push(args);
                return reply(...args);
              },
            }),
          },
        };
      throw Error(`Unexpected import: ${id}`);
    },
    module,
    module.exports,
  );
  let state;
  await renderToString(
    vue.createSSRApp({
      setup() {
        state = module.exports.default.setup(props, { expose() {} });
        return () => null;
      },
    }),
  );
  return { state, access, store, props, calls, routes, dispose: () => cleanup.forEach((fn) => fn()) };
}

test('only the owner of a finished public bot game can rematch; slots update reactively', async () => {
  const f = await fixture();
  assert.equal(f.state.eligible.value, true);
  assert.equal(f.state.canRestart.value, true);
  f.access.botModes.value.regular = false;
  assert.equal(f.state.canRestart.value, false);
  await f.state.restart();
  assert.equal(f.calls.length, 0);
  f.access.botModes.value.regular = true;
  f.access.accessStatus.value = 'error';
  assert.equal(f.state.canRestart.value, false);
  f.store.state.profile.id = 'friend';
  assert.equal(f.state.eligible.value, false);
  f.store.state.profile.id = 'owner';
  f.props.room.game.stage = 'onMission';
  assert.equal(f.state.eligible.value, false);
});

test('rematch ignores duplicate clicks and navigates to the acknowledged room', async () => {
  let finish;
  const f = await fixture(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = f.state.restart();
  await f.state.restart();
  assert.deepEqual(f.calls, [['restartHumanAiRoom', 'old']]);
  finish({ roomID: 'next' });
  await first;
  assert.deepEqual(f.routes, ['next']);
  assert.equal(f.state.busy.value, false);
});

test('a slot taken after rendering leaves the completed game visible with an error', async () => {
  const f = await fixture(async () => ({ error: 'No free bot slots' }));
  await f.state.restart();
  assert.deepEqual(f.routes, []);
  assert.equal(f.state.error.value, 'aiArena.botPlayError');
  assert.equal(f.state.busy.value, false);
});

test('a late rematch response cannot navigate after the component was left', async () => {
  let finish;
  const f = await fixture(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = f.state.restart();
  f.dispose();
  finish({ roomID: 'next' });
  await pending;
  assert.deepEqual(f.routes, []);
});

test('a previously created own match can be resumed without reserving a second slot', async () => {
  const f = await fixture();
  f.access.ownRoomID.value = 'already-created';
  f.access.botModes.value.regular = false;
  await f.state.restart();
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.routes, ['already-created']);
});

test('large-table rematches retain the Premium restriction', async () => {
  const f = await fixture();
  f.props.room.ai.playerCount = 7;
  assert.equal(f.state.canRestart.value, false);
  f.access.canPlayLargeTables.value = true;
  assert.equal(f.state.canRestart.value, true);
});

test('non-Premium seven-player rematches with two bots retain lobby eligibility', async () => {
  const f = await fixture();
  f.props.room.ai.playerCount = 7;
  f.props.room.ai.humanPlayerIDs = ['owner', 'a', 'b', 'c', 'd'];
  assert.equal(f.state.canRestart.value, true);
  f.props.room.ai.humanPlayerIDs.pop();
  assert.equal(f.state.canRestart.value, false);
});
