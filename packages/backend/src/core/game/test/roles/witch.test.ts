import { generateNewGame } from '@/core/game/test/const';
import * as _ from 'lodash';

let { game, gameHelper } = generateNewGame();

describe('Witch', () => {
  beforeAll(() => {
    const restart = generateNewGame({}, { witch: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('After first mission should be stage witchAbility', async () => {
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    expect(game.stage).toBe('witchAbility');
    expect(_.last(game.history)?.type).toBe('vote');
  });

  test('Stage should repeat if ability not used', async () => {
    gameHelper.useWitchAbility(false).selectPlayersOnMission(1).sentSelectedPlayers().makeVotes().makeActions(1);

    expect(game.missions[0].data.hidden).toBeFalsy();
    expect(game.stage).toBe('witchAbility');
    expect(_.last(game.history)?.type).toBe('vote');
  });

  test('Should skip stage if already used ability', async () => {
    gameHelper.useWitchAbility().selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions(1);

    expect(game.missions[1].data.hidden).toBeTruthy();
    expect(game.stage).toBe('selectTeam');
    expect(_.last(game.history)?.type).toBe('mission');
  });

  test('Excalibur should be before witch', async () => {
    const restart = generateNewGame({ excalibur: true }, { witch: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;

    gameHelper.selectPlayersOnMission(1).sentSelectedPlayers().giveExcalibur().makeVotes().makeActions(1);

    expect(game.stage).toBe('useExcalibur');

    gameHelper.useExcalibur(false);

    expect(game.stage).toBe('witchAbility');
  });
});
