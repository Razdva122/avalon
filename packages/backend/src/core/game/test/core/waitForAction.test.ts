import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Wait for action', () => {
  beforeEach(() => {
    const restart = generateNewGame({}, { merlin: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Validate wait action shows correct', () => {
    expect(game.leader.features.waitForAction).toBeTruthy();

    gameHelper.selectPlayersOnMission().sentSelectedPlayers();
    expect(game.players.every((player) => player.features.waitForAction)).toBeTruthy();

    game.voteForMission('1', 'approve');
    expect(game.players.find((player) => player.user.id === '1')?.features.waitForAction).toBeFalsy();

    gameHelper.makeVotes();
    expect(game.players.every((player) => player.features.isSent === player.features.waitForAction)).toBeTruthy();

    const playerFromMission = game.players.find((player) => player.features.isSent)!;
    game.actionOnMission(playerFromMission.user.id, 'success');
    expect(playerFromMission.features.waitForAction).toBeFalsy();
  });

  test('Assassinate correct wait', () => {
    gameHelper
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions()
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions()
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions();

    expect(game.players.find((player) => player.features.isAssassin && player.features.waitForAction)).toBeTruthy();

    gameHelper.pickMerlin(true);

    expect(game.players.find((player) => player.features.isAssassin && player.features.waitForAction)).toBeFalsy();
  });
});
