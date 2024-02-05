import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Excalibur logic', () => {
  beforeAll(() => {
    const restart = generateNewGame({ excalibur: true });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('After select team should be stage give excalibur', () => {
    gameHelper.selectPlayersOnMission().sentSelectedPlayers();

    expect(game.stage).toBe('giveExcalibur');
    expect(game.players.filter((player) => player.features.waitForAction).length).toBe(1);
  });

  test('Give excalibur to player', () => {
    gameHelper.giveExcalibur();

    expect(game.stage).toBe('votingForTeam');
    expect(game.players.filter((player) => player.features.excalibur).length).toBe(1);
  });

  test('All players votes + make actions should be stage use excalibur', () => {
    gameHelper.makeVotes().makeActions();

    expect(game.stage).toBe('useExcalibur');
    expect(game.players.find((player) => player.features.excalibur && player.features.waitForAction)).toBeTruthy();
  });

  test('Use excalibur', () => {
    gameHelper.useExcalibur();

    expect(game.stage).toBe('selectTeam');
    expect(game.missions[0].data.fails).toBe(1);
    expect(game.missions[0].data.result).toBe('fail');
  });

  test('Use excalibur on single fail should win mission', () => {
    const evilToFail = game.players.find((player) => player.role.loyalty === 'evil' && !player.features.isLeader)!;
    game.selectPlayer(game.leader.user.id, evilToFail.user.id);
    gameHelper.selectPlayersOnMission(0, -1).sentSelectedPlayers();

    const playerId = game.players.find(
      (player) => !player.features.isLeader && player.features.isSent && player !== evilToFail,
    )!.user.id;

    gameHelper.giveExcalibur(playerId).makeVotes().makeActions(1).useExcalibur(true, false);

    expect(game.stage).toBe('selectTeam');
    expect(game.missions[1].data.fails).toBe(0);
    expect(game.missions[1].data.result).toBe('success');
  });

  test('Reject voting excalibur should be expired', () => {
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().giveExcalibur().makeVotes(game.players.length);

    expect(game.players.filter((player) => player.features.excalibur).length).toBe(0);
  });

  test('Game should ended but excalibur save game', () => {
    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .giveExcalibur()
      .makeVotes()
      .makeActions(1)
      .useExcalibur(false);

    expect(game.stage).toBe('selectTeam');
    expect(game.missions[2].data.fails).toBe(1);

    gameHelper
      .selectPlayersOnMission(2)
      .sentSelectedPlayers()
      .giveExcalibur()
      .makeVotes()
      .makeActions(2)
      .useExcalibur(true, false);

    expect(game.stage).toBe('selectTeam');
    expect(game.missions[3].data.fails).toBe(1);
  });

  test('Game should win but excalibur lose game', () => {
    gameHelper
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .giveExcalibur()
      .makeVotes()
      .makeActions()
      .useExcalibur(true, true);

    expect(game.stage).toBe('end');
    expect(game.winner).toBe('evil');
    expect(game.missions[4].data.fails).toBe(1);
  });
});
