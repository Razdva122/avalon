const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');

function compile(path, load) {
  let source = fs.readFileSync(require.resolve(path), 'utf8');
  if (path.endsWith('.vue')) source = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const exports = {};
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'exports', code)(load, exports);
  return exports;
}

const helpers = compile('../src/components/view/board/helpers.ts', require);
const animationRender = compile('../src/components/view/board/animations/render.ts', require);
const { GameStateManager } = compile('../src/helpers/game-state-manager/index.ts', (id) =>
  id === 'vue' ? { ...vue, provide() {} } : id.startsWith('@/') ? {} : require(id),
);
const declaration = { type: 'announceLoyalty', announcerID: 'p1', targetID: 'p2', announced: 'evil', actual: 'good' };
const attack = { type: 'assassinate', assassinateType: 'merlin', result: 'miss', killedIDs: ['p2'], assassinID: 'p3' };
const players = ['merlin', 'percival', 'minion'].map((role, i) => ({
  id: `p${i + 1}`,
  role,
  features: { isLeader: i === 0 },
}));
const game = (history = [], extra = {}) => ({
  uuid: 'game-a',
  stage: 'assassinate',
  history,
  players,
  features: {},
  missionState: [],
  addonsData: {},
  ...extra,
});
const result = { winner: 'good', reason: 'missMerlin' };
const room = (gameState) => ({ stage: 'started', roomID: 'game-a', players, game: gameState });

function fixture(t, initial = game(), reducedMotion = false) {
  const manager = new GameStateManager();
  manager.mutateRoomState({ newRoomState: room(initial) });
  const draws = [];
  const emitted = [];
  const unmount = [];
  const timers = new Map();
  const users = vue.reactive(
    Object.fromEntries(
      players.map((player, i) => [
        player.id,
        {
          status: 'ready',
          profile: { name: ['Алиса', 'Борис', 'Вера'][i] },
        },
      ]),
    ),
  );
  const labels = ['selected', 'selected', 'survivor'].map((owner) => ({
    dataset: { cardOwner: owner },
    textContent: '',
    title: '',
  }));
  const originals = { window: global.window, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout };
  let timerID = 0;
  global.window = { matchMedia: () => ({ matches: reducedMotion }) };
  global.setTimeout = (callback, delay) => {
    timers.set(++timerID, { callback, delay });
    return timerID;
  };
  global.clearTimeout = (id) => timers.delete(id);
  const keys = { gameStateKey: Symbol(), stateManagerKey: Symbol() };
  const render = (kind) => (_container, options) => {
    const draw = { kind, options, cleaned: false };
    draws.push(draw);
    return () => {
      draw.cleaned = true;
    };
  };
  const Board = compile('../src/components/view/board/Board.vue', (id) => {
    if (id === 'vue')
      return {
        ...vue,
        inject: (key) => (key === keys.gameStateKey ? manager.game : manager),
        onUnmounted: (callback) => unmount.push(callback),
      };
    if (id === 'vue-router') return { useRouter: () => ({ push() {} }) };
    if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
    if (id === '@/helpers/game-state-manager') return keys;
    if (id === '@/store') return { useStore: () => ({ state: { users, profile: { id: 'p3' } } }) };
    if (id === '@/helpers/styles')
      return { calculateRoleUrl: (role) => `roles/${require('lodash/snakeCase')(role)}.webp` };
    if (id === '@/components/view/board/helpers') return helpers;
    if (id === '@/helpers/images')
      return {
        getImagePathByID: (type, name) => `${type}/${name}.webp`,
        getThumbnailPathByID: (type, name) => `${type}/${name}.webp`,
      };
    if (id === './animations/render')
      return {
        ...animationRender,
        renderLoyalty: render('lady'),
        renderAssassination: render('assassination'),
      };
    if (id.startsWith('@/') || id.startsWith('./')) return {};
    return require(id);
  }).default;
  const scope = vue.effectScope();
  const api = scope.run(() =>
    Board.setup(
      vue.reactive({
        get roomState() {
          return manager.state.value;
        },
        spectatorRoles: {},
        spectatorDecisions: [],
      }),
      { emit: (event, value) => emitted.push({ event, value }) },
    ),
  );
  // Board and replay watchers use the real Vue scheduler; rendering and geometry are stubbed.
  api.cardEffectRef.value = { querySelectorAll: () => labels };
  api.loyaltyEffectRef.value = {};
  api.boardRef.value = {
    offsetWidth: 600,
    offsetHeight: 600,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 600, height: 600 }),
    querySelectorAll: () =>
      players.map((player, i) => ({
        dataset: { playerId: player.id },
        querySelector: () => ({ getBoundingClientRect: () => ({ x: 100 * i, y: 100 * i, width: 115, height: 115 }) }),
      })),
  };
  t.after(() => {
    unmount.forEach((callback) => callback());
    scope.stop();
    Object.assign(global, originals);
    if (originals.window === undefined) delete global.window;
  });
  return {
    api,
    draws,
    timers,
    manager,
    users,
    labels,
    emitted,
    flush: async () => {
      for (let i = 0; i < 5; i++) await vue.nextTick();
    },
  };
}

test('real Board watchers keep a Lady declaration from consuming the pending final assassination', async (t) => {
  const f = fixture(t);
  f.manager.mutateRoomState({ newGameState: game([declaration]) });
  await f.flush();
  assert.deepEqual(
    f.draws.map((draw) => draw.kind),
    ['lady'],
  );
  assert.equal(f.draws[0].options.teamImage, 'core/red_team_no_background.webp');

  f.manager.mutateRoomState({ newRoomState: room(game([declaration, attack], { result })), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1, 'the early winner has not revealed roles or replayed the declaration');
  assert.equal(
    f.api.assassinationActive.value,
    true,
    'the early winner stays concealed while waiting for revealed roles',
  );

  const ended = game([declaration, attack], { stage: 'end', result });
  f.manager.mutateRoomState({ newRoomState: room(ended), isLiveUpdate: true });
  await f.flush();
  f.manager.mutateRoomState({ newGameState: ended });
  await f.flush();
  assert.deepEqual(
    f.draws.map((draw) => draw.kind),
    ['lady', 'assassination'],
  );
  assert.equal(f.draws[1].options.roleImage, 'roles/percival.webp');
  assert.equal(f.draws[1].options.survivorImage, 'roles/merlin.webp');
  assert.equal(f.draws[1].options.playerName, 'Борис');
  assert.equal(f.draws[1].options.survivorName, 'Алиса');
  assert.equal(f.draws[1].options.hit, false);
  assert.equal(f.api.assassinationActive.value, true);

  f.manager.toggleViewMode();
  await f.flush();
  assert.equal(f.api.assassinationActive.value, false);
  assert.equal(f.draws[1].cleaned, true);
  assert.equal(f.timers.size, 0);
  f.manager.toggleViewMode();
  await f.flush();
  assert.equal(f.draws.length, 2, 'returning to live does not replay the attack');
});

test('AI room end updates render Guinevere once and preserve the cards through bot status updates', async (t) => {
  const f = fixture(t);
  const event = { ...attack, assassinateType: 'guinevere' };
  const ended = game([event], {
    stage: 'end',
    players: players.map((p, i) => (i === 0 ? { ...p, role: 'guinevere' } : p)),
    result: { winner: 'good', reason: 'missGuinevere' },
  });
  f.manager.mutateRoomState({ newRoomState: { ...room(ended), ai: { status: 'running' } }, isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1);
  assert.equal(f.draws[0].options.survivorImage, 'roles/guinevere.webp');
  f.manager.mutateRoomState({ newRoomState: { ...room(ended), ai: { status: 'finished' } }, isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1);
  assert.equal(f.draws[0].cleaned, false);
  assert.equal([...f.timers.values()][0].delay, 10000);
});

for (const earlyWinner of [false, true]) {
  test(`routine game updates cannot expose final roles ${earlyWinner ? 'before the final snapshot' : 'during the reveal'}`, async (t) => {
    const hiddenPlayers = players.map((player) => ({ ...player, role: 'unknown' }));
    const f = fixture(t, game([], { players: hiddenPlayers }));
    // Routine selections/status updates make the current game also a replay snapshot.
    f.manager.mutateRoomState({ newGameState: game([], { players: hiddenPlayers }) });
    await f.flush();
    if (earlyWinner) {
      f.manager.mutateRoomState({ newGameState: game([attack], { players: hiddenPlayers, result }) });
      await f.flush();
      assert.equal(f.api.assassinationActive.value, true, 'conceal the early winner until public end roles arrive');
    }
    f.manager.mutateRoomState({ newGameState: game([attack], { stage: 'end', result }) });
    await f.flush();
    assert.equal(f.draws.length, 1);
    assert.equal(f.api.assassinationActive.value, true);
    assert.equal(f.api.players.value[0].role, 'unknown', 'keep table portraits hidden through the card scene');
  });
}

test('card nicknames update when public profiles arrive after the reveal starts', async (t) => {
  const f = fixture(t);
  f.users.p1 = { status: 'loading' };
  f.users.p2 = { status: 'loading' };
  f.manager.mutateRoomState({ newRoomState: room(game([attack], { stage: 'end', result })), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws[0].options.playerName, '…');
  f.users.p1 = { status: 'ready', profile: { name: 'Мерлин · AI' } };
  f.users.p2 = { status: 'ready', profile: { name: 'Игрок <&>' } };
  await f.flush();
  assert.deepEqual(
    f.labels.map((label) => label.textContent),
    ['Игрок <&>', 'Игрок <&>', 'Мерлин · AI'],
  );
  assert.deepEqual(
    f.labels.map((label) => label.title),
    ['Игрок <&>', 'Игрок <&>', 'Мерлин · AI'],
  );
  assert.equal(f.draws.length, 1, 'profile loading does not restart the animation');
});

test('Cleric attacks never conceal the end result or start a card scene', async (t) => {
  const f = fixture(t);
  const event = { ...attack, assassinateType: 'cleric' };
  f.manager.mutateRoomState({ newRoomState: room(game([event], { stage: 'end', result })), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 0);
  assert.equal(f.api.assassinationActive.value, false);
});

test('initial history and replacement snapshots are baselines and cancel any active Board scene', async (t) => {
  const f = fixture(t, game([declaration]));
  await f.flush();
  assert.deepEqual(
    f.emitted,
    [{ event: 'assassination-active', value: false }],
    'a fresh Board resets Room after an error or reconnect remount',
  );
  assert.equal(f.draws.length, 0);
  assert.equal(f.api.loyaltyBadges.value.p2, undefined, 'past announcements do not leave badges on the table');

  const nextDeclaration = { ...declaration, announced: 'good' };
  f.manager.mutateRoomState({ newGameState: game([declaration, nextDeclaration]) });
  await f.flush();
  assert.equal(f.draws.length, 1);
  f.manager.mutateRoomState({ newRoomState: room(game([declaration, nextDeclaration])) });
  await f.flush();
  assert.equal(f.draws[0].cleaned, true);
  assert.equal(f.timers.size, 0);

  f.manager.mutateRoomState({
    newRoomState: {
      ...room(game([declaration, nextDeclaration, attack], { stage: 'end', result })),
      archived: true,
    },
  });
  await f.flush();
  assert.equal(f.draws.length, 1, 'a reconnect or archive snapshot never autoplays the newly included attack');
});

test('reduced motion renders a static final reveal and its cleanup restores the Board', async (t) => {
  const f = fixture(t, game(), true);
  f.manager.mutateRoomState({
    newRoomState: room(game([attack], { stage: 'end', result })),
    isLiveUpdate: true,
  });
  await f.flush();
  assert.equal(f.draws.length, 1);
  assert.equal(f.draws[0].options.reducedMotion, true);
  assert.equal(f.api.assassinationActive.value, true);
  assert.equal(f.timers.size, 1);
  const timer = [...f.timers.values()][0];
  assert.equal(timer.delay, 10000, 'static cards get the same reading time');
  timer.callback();
  await f.flush();
  assert.equal(f.draws[0].cleaned, true);
  assert.equal(f.api.assassinationActive.value, false);
  assert.equal(f.timers.size, 0);
});

test('the Lady badge disappears when the ten-second event display ends', async (t) => {
  const f = fixture(t);
  f.manager.mutateRoomState({ newGameState: game([declaration]) });
  await f.flush();
  assert.equal(f.api.timerDuration.value, 10000);
  assert.equal(f.api.loyaltyBadges.value.p2.team, 'evil');
  [...f.timers.values()][0].callback();
  await f.flush();
  assert.equal(f.api.activeLoyaltyTarget.value, undefined, 'badge stays after the flight finishes');
  assert.equal(f.api.loyaltyBadges.value.p2.team, 'evil');
  f.api.clearHistoryElement();
  await f.flush();
  assert.equal(f.api.loyaltyBadges.value.p2, undefined, 'badge disappears with the event display');
});

for (const hit of [false, true]) {
  test(`${hit ? 'hit' : 'miss'} cards remain on the board for at least ten seconds before restoring the result`, async (t) => {
    const f = fixture(t);
    const event = hit ? { ...attack, result: 'hit', killedIDs: ['p1'] } : attack;
    const finalResult = hit ? { winner: 'evil', reason: 'killMerlin' } : result;
    f.manager.mutateRoomState({
      newRoomState: room(game([event], { stage: 'end', result: finalResult })),
      isLiveUpdate: true,
    });
    await f.flush();
    const timer = [...f.timers.values()][0];
    assert.equal(timer.delay, 10000);
    assert.equal(f.api.assassinationActive.value, true);
    assert.deepEqual(
      f.emitted.at(-1),
      { event: 'assassination-active', value: true },
      'Room can conceal the rating button during the reveal',
    );
    assert.equal(f.draws[0].cleaned, false);
    timer.callback();
    await f.flush();
    assert.equal(f.draws[0].cleaned, true);
    assert.equal(f.api.assassinationActive.value, false);
    assert.deepEqual(
      f.emitted.at(-1),
      { event: 'assassination-active', value: false },
      'Room can restore the rating button after the reveal',
    );
  });
}
