import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Lady of the sea', () => {
  beforeAll(() => {
    const restart = generateNewGame({ ladyOfSea: true }, { mordred: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Player should know role if he checks evil player', () => {
    const evilPlayer = game.players.find(
      (player) => player.role.loyalty === 'evil' && player.features.ladyOfSea === undefined,
    )!;
    const ownerLadyId = game.players.find((player) => player.features.ladyOfSea === 'has')!.userID;

    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .useLadyOfSea(evilPlayer.userID)
      .announceLoyalty('good');

    expect(game.visibleRolesState[ownerLadyId][evilPlayer.userID]).toBe(evilPlayer.role.role);
  });
});
