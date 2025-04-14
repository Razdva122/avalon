import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Revealer', () => {
  beforeEach(() => {
    const restart = generateNewGame({}, { revealer: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Should reveal after second fail mission', () => {
    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

    const revealerId = game.players.find((player) => player.role.role === 'revealer')!.userID;

    expect(game.visibleRolesState.all).toStrictEqual({ [revealerId]: 'revealer' });
  });

  test('Should skip success missions reveal after second fail mission', () => {
    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions();

    expect(game.visibleRolesState.all).toStrictEqual(undefined);

    gameHelper.selectPlayersOnMission(1).sentSelectedPlayers().makeVotes().makeActions(1);

    const revealerId = game.players.find((player) => player.role.role === 'revealer')!.userID;

    expect(game.visibleRolesState.all).toStrictEqual({ [revealerId]: 'revealer' });
  });
});
