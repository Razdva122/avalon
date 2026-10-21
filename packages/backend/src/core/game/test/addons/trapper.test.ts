import { GameTestHelper } from '@/core/game/test/helpers';
import type { Game, IPlayerInGame } from '@/core/game';
import type { GameOptions } from '@avalon/types';

function create(players = 8, extra: GameOptions['addons'] = {}) {
  return new GameTestHelper(players, {
    roles: {},
    addons: { trapper: true, ...extra },
    features: {},
  });
}
function discard(game: Game, target: IPlayerInGame, executor = game.leader.userID) {
  game.clearSelectedPlayers();
  game.selectPlayer(executor, target.userID);
  game.addons.trapper!.discardMissionCard(executor);
}

test.each([8, 9, 10])('Trapper adds one participant at %s players, without mutating presets', (count) => {
  const { game } = create(count);
  expect(game.settings.missions.map((m) => m.players)).toEqual([4, 5, 5, 6, 6]);
  expect(new GameTestHelper(count, { roles: {}, addons: {}, features: {} }).game.settings.missions[0].players).toBe(3);
});

test.each([5, 6, 7])('Trapper rejects %s players', (count) => {
  expect(() => create(count)).toThrow(/8.*10/);
});

test('Trapper rejects plot cards', () => {
  expect(() => create(8, { plotCards: true })).toThrow(/plot/i);
});

test('Leader excludes a fail; only leader learns it, including after reconnect', () => {
  const helper = create();
  const { game } = helper;
  helper.selectPlayersOnMission(1).sentSelectedPlayers().makeVotes().makeActions(1);
  expect(game.stage).toBe('discardMissionCard');
  const target = game.currentMission.data.actions.find((a) => a.value === 'fail')!.player;
  const leader = game.leader;
  discard(game, target);
  expect(game.missions[0].data).toMatchObject({ result: 'success', fails: 0 });
  const history = game.history.find((h) => (h.type as string) === 'discardMissionCard')!;
  expect(history.dataForManager({ game, userID: leader.userID })).toMatchObject({
    targetID: target.userID,
    result: 'fail',
  });
  expect(history.dataForManager({ game })).not.toHaveProperty('result');
  const bystander = game.players.find((p) => p !== leader && p !== target)!;
  expect(history.dataForManager({ game, userID: bystander.userID })).not.toHaveProperty('result');
  game.endGame('manualy');
  expect(history.dataForManager({ game })).toHaveProperty('result', 'fail');
});

test('No peek before committing; invalid targets and repeated actions are rejected', () => {
  const helper = create();
  const { game } = helper;
  helper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
  const outsider = game.players.find((p) => !p.features.isSent)!;
  expect(() => discard(game, outsider)).toThrow(/mission/i);
  expect(game.stage).toBe('discardMissionCard');
  expect(game.history.some((h) => (h.type as string) === 'discardMissionCard')).toBe(false);
  const target = game.currentMission.data.actions[0].player;
  const nonLeader = game.players.find((p) => p !== game.leader)!;
  expect(() => discard(game, target, nonLeader.userID)).toThrow();
  discard(game, target);
  expect(() => discard(game, target)).toThrow();
});

test.each([false, true])('Excalibur use=%s resolves before Trapper; changed card can be excluded', (use) => {
  const helper = create(8, { excalibur: true });
  const { game } = helper;
  helper.selectPlayersOnMission().sentSelectedPlayers().giveExcalibur().makeVotes().makeActions();
  expect(game.stage).toBe('useExcalibur');
  const mission = game.currentMission;
  helper.useExcalibur(use);
  expect(game.stage).toBe('discardMissionCard');
  const target = mission.data.actions.find((a) => a.switchedBy)?.player ?? mission.data.actions[0].player;
  discard(game, target);
  expect(mission.data).toMatchObject({ result: 'success', fails: 0 });
});

test('Excluding one fail leaves the fourth mission successful with one remaining fail', () => {
  const helper = create();
  const { game } = helper;
  for (let round = 0; round < 4; round++) {
    helper
      .selectPlayersOnMission(round === 3 ? 2 : 1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(round === 3 ? 2 : 1);
    const mission = game.currentMission;
    const target =
      round === 3
        ? mission.data.actions.find((a) => a.value === 'fail')!.player
        : mission.data.actions.find((a) => a.value === (round === 1 ? 'success' : 'fail'))!.player;
    discard(game, target);
    if (round === 3)
      expect(mission.data).toMatchObject({ fails: 1, result: 'success', settings: { failsRequired: 2 } });
  }
});

test('Timer excludes exactly one card and advances without a stuck turn', () => {
  jest.useFakeTimers();
  const helper = create();
  const { game } = helper;
  try {
    game.features.timerDurations = { discardMissionCard: { enabled: true, duration: 1 } } as NonNullable<
      typeof game.features.timerDurations
    >;
    helper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    expect(game.stage).toBe('discardMissionCard');
    jest.advanceTimersByTime(20000);
    expect(game.stage).toBe('selectTeam');
    expect(game.history.filter((h) => (h.type as string) === 'discardMissionCard')).toHaveLength(1);
  } finally {
    game.timer.cleanup();
    jest.useRealTimers();
  }
});

test('Leader may exclude their own card', () => {
  const helper = create();
  const { game } = helper;
  const leader = game.leader;
  game.selectPlayer(leader.userID, leader.userID);
  helper.selectPlayersOnMission(0, -1).sentSelectedPlayers().makeVotes().makeActions();
  discard(game, leader);
  expect(game.missions[0].data.actions.find((a) => a.player === leader)?.discarded).toBe(true);
});

test('Two remaining fails still fail the fourth mission', () => {
  const helper = create();
  const { game } = helper;
  for (let round = 0; round < 4; round++) {
    helper
      .selectPlayersOnMission(round === 3 ? 2 : 1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(round === 3 ? 2 : 1);
    const mission = game.currentMission;
    discard(
      game,
      mission.data.actions.find((a) => a.value === (round === 1 || round === 3 ? 'success' : 'fail'))!.player,
    );
    if (round === 3) expect(mission.data).toMatchObject({ fails: 2, result: 'fail' });
  }
});

test.each([false, true])('Trapper timer waits for Excalibur use=%s result scene before counting down', (use) => {
  jest.useFakeTimers();
  const helper = create(8, { excalibur: true });
  const { game } = helper;
  try {
    game.features.timerDurations = {
      onMission: { enabled: true, duration: 30 },
      discardMissionCard: { enabled: true, duration: 1 },
    };
    helper.selectPlayersOnMission().sentSelectedPlayers().giveExcalibur().makeVotes().makeActions().useExcalibur(use);
    expect(game.timer.getTimerState().active).toBe(false);
    const scene = use ? 3000 : 2000;
    jest.advanceTimersByTime(scene);
    expect(game.stage).toBe('discardMissionCard');
    expect(game.timer.getTimerState().active).toBe(true);
    jest.advanceTimersByTime(1000);
    expect(game.stage).toBe('selectTeam');
  } finally {
    game.timer.cleanup();
    jest.useRealTimers();
  }
});
