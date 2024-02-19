import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Assassinate logic', () => {
  beforeEach(() => {
    const restart = generateNewGame({}, { merlin: 1, isolde: 1, tristan: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;

    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
  });

  describe('Merlin logic', () => {
    test('Pick wrong merlin', () => {
      expect(game.stage).toBe('assassinate');
      gameHelper.pickMerlin();

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('good');
    });

    test('Pick correct merlin', () => {
      gameHelper.pickMerlin(true);

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('evil');
    });
  });

  describe('Lovers logic', () => {
    test('Select valid lovers', () => {
      gameHelper.pickLovers(['isolde', 'tristan']);

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('evil');
    });

    test('Select isolde and miss tristan', () => {
      gameHelper.pickLovers(['isolde']);

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('good');
    });

    test('Select tristan and miss isolde', () => {
      gameHelper.pickLovers(['tristan']);

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('good');
    });

    test('Miss tristan and isolde', () => {
      gameHelper.pickLovers([]);

      expect(game.stage).toBe('end');
      expect(game.winner).toBe('good');
    });
  });
});
