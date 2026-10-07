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
  missionState: [{ players: 2, failsRequired: 1 }],
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
        renderMission: render('mission'),
        renderExcalibur: render('excalibur'),
        renderAssassination: render('assassination'),
        renderPairAssassination: render('pair'),
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
  api.missionEffectRef.value = {};
  api.boardRef.value = {
    querySelector: () => ({ getBoundingClientRect: () => ({ x: 200, y: 210, width: 65, height: 65 }) }),
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
    displayedMissions: () => {
      const Game = compile('../src/components/view/board/game/Game.vue', (id) => {
        if (id === 'vue') return { ...vue, inject: (key) => (key === keys.gameStateKey ? manager.game : manager) };
        if (id === 'vue-i18n') return { useI18n: () => ({ t: (key) => key }) };
        if (id === '@/helpers/game-state-manager') return keys;
        if (id.startsWith('@/')) return {};
        return require(id);
      }).default;
      return Game.setup({
        visibleHistory: api.visibleHistory.value,
        missionAnimationActive: api.missionAnimationActive.value,
        pendingMission: api.pendingMission.value,
      }).displayMissions.value;
    },
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

test('a Cleric event with an unrelated end reason does not start a card scene', async (t) => {
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

test('live Lovers pair runs once, keeps public player names, and masks end roles', async (t) => {
  const hiddenPlayers = players.map((player) => ({ ...player, role: 'unknown' }));
  const f = fixture(t, game([], { players: hiddenPlayers }));
  const event = { ...attack, assassinateType: 'lovers', result: 'hit', killedIDs: ['p1', 'p2'] };
  const ended = game([event], {
    stage: 'end',
    result: { winner: 'evil', reason: 'killLovers' },
    players: players.map((p, i) => ({ ...p, role: ['tristan', 'isolde', 'minion'][i] })),
  });
  f.manager.mutateRoomState({ newRoomState: room(ended), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1);
  assert.equal(f.draws[0].kind, 'pair');
  assert.equal(f.draws[0].options.variant, 'cut');
  assert.deepEqual(
    f.draws[0].options.cards.map((card) => card.playerName),
    ['Алиса', 'Борис'],
  );
  assert.equal(f.api.players.value[0].role, 'unknown');
  f.manager.mutateRoomState({ newRoomState: room(ended), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1);
});

test('Cleric first-stage verdict is replaced by the final pair and cancels its old timer', async (t) => {
  const f = fixture(t);
  const first = { ...attack, assassinateType: 'cleric', result: 'hit', killedIDs: ['p1'] };
  const clericPlayers = players.map((p, i) => (i === 0 ? { ...p, role: 'cleric' } : p));
  const pending = game([first], {
    players: clericPlayers,
    addonsData: { assassin: { progressData: { type: 'cleric', stage: 1 } } },
  });
  f.manager.mutateRoomState({ newRoomState: room(pending), isLiveUpdate: true });
  await f.flush();
  assert.equal(f.draws.length, 1);
  assert.equal(f.draws[0].options.cards.length, 1);
  assert.equal([...f.timers.values()][0].delay, 2000);
  assert.equal(f.api.players.value[0].role, 'cleric');
  const second = { ...first, result: 'miss', killedIDs: ['p2'] };
  f.manager.mutateRoomState({
    newRoomState: room(
      game([first, second], { players: clericPlayers, stage: 'end', result: { winner: 'good', reason: 'missCleric' } }),
    ),
    isLiveUpdate: true,
  });
  await f.flush();
  assert.equal(f.draws.length, 2);
  assert.equal(f.draws[0].cleaned, true);
  assert.equal(f.draws[1].options.variant, 'verdict');
  assert.deepEqual(
    f.draws[1].options.cards.map((card) => card.hit),
    [true, false],
  );
  assert.equal(f.timers.size, 1);
  assert.equal([...f.timers.values()][0].delay, 10000);
});

test('pair nicknames update without restarting the scene when public profiles arrive late', async (t) => {
  const f = fixture(t);
  f.labels[0].dataset.cardOwner = 'p1';
  f.labels[1].dataset.cardOwner = 'p1';
  f.labels[2].dataset.cardOwner = 'p2';
  f.users.p1 = { status: 'loading' };
  f.users.p2 = { status: 'loading' };
  const event = { ...attack, assassinateType: 'lovers', result: 'hit', killedIDs: ['p1', 'p2'] };
  f.manager.mutateRoomState({
    newRoomState: room(game([event], { stage: 'end', result: { reason: 'killLovers' } })),
    isLiveUpdate: true,
  });
  await f.flush();
  f.users.p1 = { status: 'ready', profile: { name: 'Первый игрок' } };
  f.users.p2 = { status: 'ready', profile: { name: 'Второй игрок' } };
  await f.flush();
  assert.deepEqual(
    f.labels.map((label) => label.textContent),
    ['Первый игрок', 'Первый игрок', 'Второй игрок'],
  );
  assert.equal(f.draws.length, 1);
});

test('new live mission starts fan once, conceals token until landing and cancels in history', async (t) => {
  const f = fixture(t, game([declaration], { stage: 'selectTeam' }));
  const event = {
    type: 'mission',
    index: 0,
    settings: { players: 2, failsRequired: 1 },
    fails: 1,
    result: 'fail',
    actions: [],
  };
  f.manager.mutateRoomState({ newGameState: game([declaration, event], { stage: 'selectTeam' }) });
  await f.flush();
  assert.deepEqual(
    f.draws.map((d) => d.kind),
    ['mission'],
  );
  assert.equal(f.api.missionAnimationActive.value, true);
  assert.equal(f.api.pendingMission.value, 0);
  assert.equal(f.draws[0].options.result, 'fail');
  assert.equal(f.displayedMissions()[0].result, undefined);
  f.draws[0].options.onReveal();
  assert.equal(f.api.pendingMission.value, undefined);
  assert.equal(f.manager.game.value.missionState[0].result, undefined, 'the replay snapshot is still behind');
  assert.equal(f.displayedMissions()[0].result, 'fail', 'landing immediately reveals the public result');
  f.manager.mutateRoomState({ newGameState: game([declaration, event], { stage: 'selectTeam' }) });
  await f.flush();
  assert.equal(f.draws.length, 1);
  f.manager.toggleViewMode();
  await f.flush();
  assert.equal(f.api.missionAnimationActive.value, false);
  assert.equal(f.draws[0].cleaned, true);
});

test('hidden missions show only witch marker while reconnect snapshots never replay', async (t) => {
  const event = {
    type: 'mission',
    index: 0,
    settings: { players: 2, failsRequired: 1 },
    fails: 0,
    result: 'success',
    actions: [],
  };
  const f = fixture(t, game([declaration, event], { stage: 'selectTeam' }));
  await f.flush();
  assert.equal(f.draws.length, 0);
  f.manager.mutateRoomState({
    newGameState: game([declaration, event, { ...event, hidden: true }], { stage: 'selectTeam' }),
  });
  await f.flush();
  assert.equal(f.draws.length, 1);
  const options = f.draws[0].options;
  assert.equal(options.hidden, true);
  assert.equal(options.fails, undefined);
  assert.equal(options.result, undefined);
  assert.equal(options.witchImage, 'roles/witch.webp');
  options.onReveal();
  assert.equal(f.displayedMissions()[0].hidden, true);
  assert.equal(f.displayedMissions()[0].result, undefined);
  assert.equal(f.displayedMissions()[0].fails, undefined);
});

test('Witch declaration and hidden mission arriving in one live update both animate in order', async (t) => {
  const f = fixture(t, game([declaration], { stage: 'announceLoyalty' }));
  const mission = { type: 'mission', index: 0, settings: { players: 2, failsRequired: 1 }, hidden: true, actions: [] };
  f.manager.mutateRoomState({
    newGameState: game([declaration, declaration, mission], {
      stage: 'selectTeam',
      timer: { active: true, endTime: 100000, isCustom: false },
    }),
  });
  await f.flush();
  assert.deepEqual(
    f.draws.map((d) => d.kind),
    ['lady'],
  );
  f.api.clearHistoryElement();
  await f.flush();
  assert.deepEqual(
    f.draws.map((d) => d.kind),
    ['lady', 'mission'],
  );
  assert.equal(f.draws[1].options.hidden, true);
  assert.equal(f.api.missionAnimationActive.value, true);
  f.draws[1].options.onReveal();
  assert.equal(f.displayedMissions()[0].hidden, true);
  assert.equal(f.api.gameTimer.value, null, 'stage timer stays hidden during the mission scene');
  f.api.clearHistoryElement();
  await f.flush();
  assert.equal(f.api.visibleHistory.value, undefined);
  assert.equal(f.api.gameTimer.value.active, true, 'next stage timer appears once both history events finish');
});

test('Excalibur use or skip runs before its bundled mission, then restores the stage timer', async (t) => {
  const f = fixture(t, game([declaration], { stage: 'useExcalibur' }));
  const action = { type: 'switchResult', switcherID: 'p1', targetID: 'p2', result: 'fail' };
  const mission = {
    type: 'mission',
    index: 0,
    settings: { players: 2, failsRequired: 1 },
    fails: 1,
    result: 'fail',
    actions: [],
  };
  f.manager.mutateRoomState({
    newGameState: game([declaration, action, mission], {
      stage: 'selectTeam',
      timer: { active: true, endTime: 100000, isCustom: false },
    }),
  });
  await f.flush();
  assert.deepEqual(
    f.draws.map((d) => d.kind),
    ['excalibur'],
  );
  assert.equal(f.api.timerDuration.value, 3000);
  assert.equal(f.draws[0].options.result, undefined);
  f.api.clearHistoryElement();
  await f.flush();
  assert.deepEqual(
    f.draws.map((d) => d.kind),
    ['excalibur', 'mission'],
  );
  assert.equal(f.draws[0].cleaned, true);
  f.api.clearHistoryElement();
  await f.flush();
  assert.equal(f.api.gameTimer.value.active, true);
});

test('Excalibur skip animates without a target and cancels on history navigation', async (t) => {
  const f = fixture(t, game([declaration], { stage: 'useExcalibur' }));
  f.manager.mutateRoomState({
    newGameState: game([declaration, { type: 'switchResult', switcherID: 'p1' }], { stage: 'selectTeam' }),
  });
  await f.flush();
  assert.equal(f.draws[0]?.kind, 'excalibur');
  assert.equal(f.draws[0].options.target, undefined);
  assert.equal(f.api.timerDuration.value, 2000);
  f.manager.toggleViewMode();
  await f.flush();
  assert.equal(f.draws[0].cleaned, true);
});
