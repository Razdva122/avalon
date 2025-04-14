import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Cleric', () => {
  beforeAll(() => {
    const restart = generateNewGame({}, { cleric: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Should reveal role of first leader', () => {
    gameHelper.selectPlayersOnMission(1).sentSelectedPlayers().makeVotes(4);

    const leader = game.leader;
    const clericId = game.players.find((player) => player.role.role === 'cleric')!.userID;

    gameHelper.selectPlayersOnMission(1).sentSelectedPlayers().makeVotes().makeActions();

    let expected;

    if (clericId === leader.userID) {
      expected = {
        [clericId]: 'cleric',
      };
    } else {
      expected = {
        [leader.userID]: leader.role.visibleLoyalty,
        [clericId]: 'cleric',
      };
    }

    expect(game.visibleRolesState[clericId]).toStrictEqual(expected);
  });
});
