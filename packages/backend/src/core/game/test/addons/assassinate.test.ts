import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('Assassinate logic', () => {
  beforeEach(() => {
    const restart = generateNewGame({}, { merlin: 1, isolde: 1, tristan: 1, cleric: 1 }, 8);
    game = restart.game;
    gameHelper = restart.gameHelper;

    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
  });

  describe('Merlin logic', () => {
    test('Pick wrong merlin', () => {
      expect(game.stage).toBe('assassinate');
      gameHelper.pickRole('merlin');

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missMerlin');
    });

    test('Pick correct merlin', () => {
      gameHelper.pickRole('merlin', true);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('evil');
      expect(game.result?.reason).toBe('killMerlin');
    });
  });

  describe('Lovers logic', () => {
    test('Select valid lovers', () => {
      gameHelper.pickLovers(['isolde', 'tristan']);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('evil');
      expect(game.result?.reason).toBe('killLovers');
    });

    test('Select isolde and miss tristan', () => {
      gameHelper.pickLovers(['isolde']);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missLovers');
    });

    test('Select tristan and miss isolde', () => {
      gameHelper.pickLovers(['tristan']);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missLovers');
    });

    test('Miss tristan and isolde', () => {
      gameHelper.pickLovers([]);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missLovers');
    });
  });

  describe('Cleric logic', () => {
    test('Select wrong cleric', () => {
      gameHelper.pickRole('cleric');

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missCleric');
    });

    test('Select correct cleric and wrong servant', () => {
      gameHelper.pickRole('cleric', true);

      expect(game.stage).toBe('assassinate');

      expect(game.selectedPlayers.length).toBe(0);

      gameHelper.pickCustomRole('servant', 'cleric');

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('good');
      expect(game.result?.reason).toBe('missCleric');
    });

    test('Select correct cleric and correct servant', () => {
      gameHelper.pickRole('cleric', true);

      expect(game.stage).toBe('assassinate');

      expect(game.selectedPlayers.length).toBe(0);

      gameHelper.pickCustomRole('servant', 'cleric', true);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('evil');
      expect(game.result?.reason).toBe('killCleric');
    });

    test('Select correct cleric and random role', () => {
      gameHelper.pickRole('cleric', true);

      expect(game.stage).toBe('assassinate');

      expect(() => gameHelper.pickCustomRole('goodLancelot', 'cleric')).toThrow('valid roles tristan, isolde');
    });

    test('Select correct cleric in low game, merlin should be available', () => {
      const restart = generateNewGame({}, { merlin: 1, cleric: 1, goodLancelot: 1, evilLancelot: 1 }, 5);
      game = restart.game;
      gameHelper = restart.gameHelper;

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

      gameHelper.pickRole('cleric', true);

      expect(game.stage).toBe('assassinate');

      expect(game.addonsData.assassin?.progressData?.possibleTargets).toStrictEqual(['merlin']);
    });

    test('Select correct cleric in low game, merlin shouldnt be available', () => {
      const restart = generateNewGame({}, { merlin: 1, cleric: 1 }, 5);
      game = restart.game;
      gameHelper = restart.gameHelper;

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

      gameHelper.pickRole('cleric', true);

      expect(game.stage).toBe('assassinate');

      expect(game.addonsData.assassin?.progressData?.possibleTargets).toStrictEqual(['servant']);
    });
  });
});
