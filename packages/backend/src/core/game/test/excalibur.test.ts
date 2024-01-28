import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Wait for action', () => {
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
});
