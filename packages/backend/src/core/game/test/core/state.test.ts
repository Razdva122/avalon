import { generateNewGame, settings } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Game state', () => {
  beforeEach(() => {
    const restart = generateNewGame();
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Select and unselect player should change game state', () => {
    game.selectPlayer(game.leader.user.id, '1');
    game.selectPlayer(game.leader.user.id, '1');
    game.selectPlayer(game.leader.user.id, '1');

    expect(gameHelper.stateChangedNumber).toEqual(3);
  });

  test('1 mission game state changes', () => {
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    const selectPlayersAndSent = settings.missions[0].players + 1;
    const votes = settings.total;
    const beforeMissionStart = 1;
    const actions = settings.missions[0].players;

    expect(gameHelper.stateChangedNumber).toEqual(selectPlayersAndSent + votes + beforeMissionStart + actions);
  });
});
