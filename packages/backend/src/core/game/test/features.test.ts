import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Features', () => {
  beforeEach(() => {
    const restart = generateNewGame();
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Fifth vote should be forced', () => {
    gameHelper
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes(game.players.length)
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes(game.players.length)
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes(game.players.length)
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes(game.players.length)
      .selectPlayersOnMission()
      .sentSelectedPlayers();

    expect(game.stage).toBe('onMission');
    expect(game.vote.stage).toBe('finished');
    expect(game.vote.data.result).toBe('approve');
    expect(game.history.length).toBe(5);
  });

  test('Leader moves to next player if vote declined', () => {
    const currentLeader = game.leader;
    expect(currentLeader.features.waitForAction).toBeTruthy();

    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes(game.players.length);

    expect(currentLeader.features.waitForAction).toBeFalsy();
    expect(currentLeader.next).toBe(game.leader);
    expect(game.leader.features.waitForAction).toBeTruthy();
  });

  test('Leader moves if mission finished', () => {
    const currentLeader = game.leader;
    expect(currentLeader.features.waitForAction).toBeTruthy();

    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    expect(currentLeader.features.waitForAction).toBeFalsy();
    expect(currentLeader.next).toBe(game.leader);
    expect(game.leader.features.waitForAction).toBeTruthy();
  });
});
