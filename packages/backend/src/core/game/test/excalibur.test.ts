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
    gameHelper.giveExcalibur(true);

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
});
