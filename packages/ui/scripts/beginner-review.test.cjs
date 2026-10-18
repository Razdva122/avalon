const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load() {
  const file = '../src/helpers/beginner-review.ts';
  if (!fs.existsSync(require('node:path').resolve(__dirname, file))) return {};
  const module = { exports: {} };
  new Function(
    'require',
    'module',
    'exports',
    ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
  )(require, module, module.exports);
  return module.exports;
}
const { beginnerReview } = load();
const ai = { beginner: true, humanPlayerID: 'me', status: 'finished' };
const game = {
  stage: 'end',
  result: { winner: 'evil', reason: 'evilTeamMissions' },
  players: [{ id: 'me', role: 'servant' }],
  history: [],
};
test('review is only available after the beginner participant finishes', () => {
  assert.equal(typeof beginnerReview, 'function');
  assert.equal(beginnerReview(game, ai, 'spectator'), null);
  assert.equal(beginnerReview(game, { ...ai, beginner: false }, 'me'), null);
  assert.equal(beginnerReview({ ...game, stage: 'onMission' }, ai, 'me'), null);
  assert.equal(beginnerReview({ ...game, result: { reason: 'manualy' } }, ai, 'me').kind, 'unfinished');
});
test('assassination takes precedence over missions without claiming why the assassin chose', () => {
  const result = beginnerReview(
    {
      ...game,
      result: { winner: 'evil', reason: 'killMerlin' },
      players: [{ id: 'me', role: 'merlin' }],
      history: [{ type: 'mission', result: 'fail', index: 0 }],
    },
    ai,
    'me',
  );
  assert.equal(result.kind, 'killMerlin');
  assert.equal(result.role, 'merlin');
  assert.equal(result.tip, 'merlin');
});
test('review cites an actual public failed mission and does not inspect secret cards', () => {
  assert.deepEqual(
    beginnerReview(
      {
        ...game,
        history: [
          { type: 'mission', hidden: true, index: 0 },
          { type: 'mission', hidden: false, result: 'fail', index: 1, actions: [{ playerID: 'bot', value: 'fail' }] },
        ],
      },
      ai,
      'me',
    ),
    { kind: 'failedMission', role: 'servant', tip: 'compare', mission: 2 },
  );
  assert.equal(
    beginnerReview({ ...game, history: [{ type: 'mission', hidden: true, index: 0 }] }, ai, 'me').kind,
    'general',
  );
});

async function reviewComponent(respond) {
  const vue = require('vue');
  const { parse, compileScript } = require('@vue/compiler-sfc');
  const filename = require('node:path').resolve(__dirname, '../src/components/view/information/BeginnerReview.vue');
  assert.ok(fs.existsSync(filename), 'the post-game card exists');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const code = ts.transpileModule(compileScript(descriptor, { id: 'review-test' }).content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const calls = [];
  const routes = [];
  const router = { currentRoute: vue.ref({ params: { uuid: 'old-room' } }) };
  const module = { exports: {} };
  const mockRequire = (id) => {
    if (id === 'vue') return vue;
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key, locale: vue.ref('ru') }) };
    if (id === 'vue-router') return { useRouter: () => router };
    if (id === '@/helpers/beginner-review') return { beginnerReview };
    if (id === '@/helpers/images') return { getAvatarPathByID: (_type, role) => `/avatars/${role}.webp` };
    if (id === '@avalon/types/room/ai-roles')
      return { aiHumanRoles: () => ['merlin', 'percival', 'servant', 'mordred', 'morgana'] };
    if (id === '@/helpers/open-room-route')
      return {
        openRoomRoute: async (_router, id) => {
          routes.push(id);
          return true;
        },
      };
    if (id === '@/api/socket')
      return {
        socket: {
          timeout: () => ({
            emitWithAck: async (...args) => {
              calls.push(args);
              return respond(...args);
            },
          }),
        },
      };
    throw Error(`Unexpected dependency ${id}`);
  };
  new Function('require', 'module', 'exports', code)(mockRequire, module, module.exports);
  let state;
  const props = vue.reactive({ game, ai: { ...ai, language: 'ru' }, userID: 'me', roomID: 'old-room' });
  await require('@vue/server-renderer').renderToString(
    vue.createSSRApp({
      setup() {
        state = module.exports.default.setup(props, { expose() {} });
        return () => null;
      },
    }),
  );
  return { state, calls, routes, props, router };
}
const access = { canPlay: true, botModes: { beginner: true } };
test('replay preserves role and language and starts before navigating, ignoring double clicks', async () => {
  let release;
  const app = await reviewComponent(async (event) => {
    if (event === 'getAiRoomAccess')
      return new Promise((resolve) => {
        release = () => resolve(access);
      });
    return event === 'createHumanAiRoom' ? { roomID: 'new-room' } : { ok: true };
  });
  const first = app.state.playAgain();
  await app.state.playAgain();
  release();
  await first;
  assert.deepEqual(app.calls, [
    ['getAiRoomAccess'],
    ['createHumanAiRoom', { beginner: true, role: 'servant', difficulty: 'regular', language: 'ru', playerCount: 5 }],
    ['startHumanAiRoom', 'new-room', { difficulty: 'regular', language: 'ru', playerCount: 5 }],
  ]);
  assert.deepEqual(app.routes, ['new-room']);
});
test('changing role affects creation and failed start retries the same prepared room', async () => {
  let starts = 0;
  const app = await reviewComponent(async (event) => {
    if (event === 'getAiRoomAccess') return access;
    if (event === 'createHumanAiRoom') return { roomID: 'prepared' };
    return ++starts === 1 ? { error: 'busy' } : { ok: true };
  });
  app.state.selectedRole.value = 'morgana';
  await app.state.playAgain();
  assert.ok(app.state.error.value);
  assert.deepEqual(app.routes, []);
  await app.state.playAgain();
  const creates = app.calls.filter(([event]) => event === 'createHumanAiRoom');
  assert.equal(creates.length, 1);
  assert.equal(creates[0][1].role, 'morgana');
  assert.deepEqual(app.routes, ['prepared']);
});
test('unavailable bots leave the review open without creating a room', async () => {
  const app = await reviewComponent(async () => ({ canPlay: true, botModes: { beginner: false }, botsBusy: true }));
  await app.state.playAgain();
  assert.equal(app.state.error.value, 'aiArena.setupBusy');
  assert.deepEqual(app.calls, [['getAiRoomAccess']]);
  assert.deepEqual(app.routes, []);
});
test('a loyal servant receives deduction advice rather than instructions to assassinate', () => {
  assert.equal(beginnerReview({ ...game, result: { winner: 'good', reason: 'missMerlin' } }, ai, 'me').tip, 'compare');
});
test('leaving for another room during creation cancels the late start and navigation', async () => {
  let release;
  const app = await reviewComponent(async (event) => {
    if (event === 'getAiRoomAccess') return access;
    if (event === 'createHumanAiRoom')
      return new Promise((resolve) => {
        release = () => resolve({ roomID: 'late-room' });
      });
    return { ok: true };
  });
  const pending = app.state.playAgain();
  await new Promise((resolve) => setImmediate(resolve));
  app.router.currentRoute.value = { params: { uuid: 'different-room' } };
  release();
  await pending;
  assert.deepEqual(
    app.calls.map(([event]) => event),
    ['getAiRoomAccess', 'createHumanAiRoom'],
  );
  assert.deepEqual(app.routes, []);
});
test('replay remains available when details are collapsed', async () => {
  const app = await reviewComponent(async (event) =>
    event === 'getAiRoomAccess' ? access : event === 'createHumanAiRoom' ? { roomID: 'compact-replay' } : { ok: true },
  );
  app.state.view.value = 'compact';
  await app.state.playAgain();
  assert.deepEqual(app.routes, ['compact-replay']);
});
test('hidden review can return to compact and expanded without changing the replay role', async () => {
  const app = await reviewComponent(async () => access);
  app.state.selectedRole.value = 'morgana';
  await app.state.setView('hidden');
  assert.equal(app.state.view.value, 'hidden');
  await app.state.setView('compact');
  assert.equal(app.state.view.value, 'compact');
  await app.state.setView('expanded');
  assert.equal(app.state.expanded.value, true);
  assert.equal(app.state.selectedRole.value, 'morgana');
  assert.deepEqual(app.calls, []);
});
test('AI review loads without hiding replay and ignores a reply after leaving the room', async () => {
  let release;
  const app = await reviewComponent(
    async () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const pending = app.state.loadAnalysis();
  assert.equal(app.state.analysisLoading.value, true);
  assert.equal(app.state.busy.value, false);
  app.router.currentRoute.value = { params: { uuid: 'different-room' } };
  release({
    status: 'complete',
    review: { decision: 'A real vote.', observation: 'A public result.', next: 'Compare teams.' },
  });
  await pending;
  assert.equal(app.state.analysis.value, undefined);
});
test('cached AI blocks replace the generic lesson; unavailable AI retains the factual fallback', async () => {
  const review = {
    decision: 'You approved mission 2.',
    observation: 'The earlier roster had failed.',
    next: 'Explain the roster change.',
  };
  const app = await reviewComponent(async () => ({ status: 'complete', review }));
  await app.state.loadAnalysis();
  assert.deepEqual(app.state.analysis.value, review);
  assert.deepEqual(app.calls, [['getBeginnerReview', 'old-room']]);
  const fallback = await reviewComponent(async () => ({ status: 'unavailable' }));
  await fallback.state.loadAnalysis();
  assert.equal(fallback.state.analysis.value, undefined);
  assert.equal(fallback.state.analysisLoading.value, false);
});
