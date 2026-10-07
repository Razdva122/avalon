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

  test('Should change stage to check loyalty stage', () => {
    gameHelper.useWitchAbility();
    const ownerOfLoyaltyCheck = game.players.find((player) => player.features.witchLoyalty)!;

    expect(game.stage).toBe('checkLoyalty');
    expect(ownerOfLoyaltyCheck.features.waitForAction).toBe(true);
  });

  test('Should skip stage if already used ability', async () => {
    gameHelper
      .useWitchCheck()
      .announceWitchLoyalty()
      .selectPlayersOnMission()
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

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

test('Witch hidden mission keeps the next stage timer after its history delay', () => {
  jest.useFakeTimers();
  const next = generateNewGame({}, { witch: 1 });
  try {
    next.game.features.timerDurations = {
      firstSelectTeam: { enabled: true, duration: 60 },
      announceLoyalty: { enabled: true, duration: 60 },
    };
    next.gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    next.gameHelper.useWitchAbility().useWitchCheck().announceWitchLoyalty();
    expect(next.game.stage).toBe('selectTeam');
    expect(next.game.timer.getTimerState().active).toBe(false);
    jest.advanceTimersByTime(10000);
    expect(next.game.timer.getTimerState().active).toBe(false);
    jest.advanceTimersByTime(10000);
    expect(next.game.timer.getTimerState()).toMatchObject({ active: true, stage: 'firstSelectTeam' });
    expect(next.game.timer.getRemainingTime()).toBe(60000);
  } finally {
    next.game.timer.cleanup();
    jest.useRealTimers();
  }
});
