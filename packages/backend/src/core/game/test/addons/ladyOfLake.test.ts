import { generateNewGame } from '@/core/game/test/const';
import * as _ from 'lodash';
import { AnnounceLoyaltyHistory } from '@/core/game/addons/check-loyalty/history';

let { game, gameHelper } = generateNewGame();

describe('Lady of the lake', () => {
  beforeAll(() => {
    const restart = generateNewGame({ ladyOfLake: true });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Last player have lady of lake card', () => {
    expect(game.addons.ladyOfLake).toBeTruthy();

    const player = game.players.find((player) => player.features.ladyOfLake === 'has');
    expect(player).toBeTruthy();

    const leader = player?.next;
    expect(leader?.features.isLeader).toBeTruthy();
  });

  test('After second mission you can state lady of lake', () => {
    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

    for (let i = 0; i < 3; i += 1) {
      expect(game.stage).toBe('checkLoyalty');

      gameHelper.useLadyOfLake();

      expect(game.stage).toBe('announceLoyalty');

      gameHelper.announceLoyalty('evil');

      const lastHistoryEl = _.last(game.history)!;

      expect(lastHistoryEl.type).toBe('announceLoyalty');
      expect((<AnnounceLoyaltyHistory>lastHistoryEl).data.announced).toBe('evil');

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    }
  });

  test('Shouldnt start after last mission session', () => {
    expect(game.stage === 'checkLoyalty').toBeFalsy();
  });

  test('Lancelots should switch before lady of lake', () => {
    const restart = generateNewGame({ ladyOfLake: true }, { goodLancelot: 1, evilLancelot: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;

    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

    expect(game.stage).toBe('checkLoyalty');
    expect(_.last(game.history)!.type).toBe('switchLancelots');
  });

  test('Guinevere should see both lancelots if she check one', () => {
    const restart = generateNewGame({ ladyOfLake: true }, { goodLancelot: 1, evilLancelot: 1, guinevere: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;

    const guinevereId = game.players.find((player) => player.role.role === 'guinevere')!.user.id;

    gameHelper
      .moveLadyOfLake(guinevereId)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

    const evilLancelotId = game.players.find((player) => player.role.role === 'evilLancelot')!.user.id;
    const goodLancelotId = game.players.find((player) => player.role.role === 'goodLancelot')!.user.id;

    gameHelper.useLadyOfLake(goodLancelotId).announceLoyalty('good');

    expect(game.visibleRolesState[guinevereId][evilLancelotId]).toBe('evilLancelot');
    expect(game.visibleRolesState[guinevereId][goodLancelotId]).toBe('goodLancelot');
  });

  test('Percival should see merlin/morgan if check mystery wizard', () => {
    const restart = generateNewGame({ ladyOfLake: true }, { percival: 1, merlin: 1, morgana: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;

    const percivalId = game.players.find((player) => player.role.role === 'percival')!.user.id;
    const merlinId = game.players.find((player) => player.role.role === 'merlin')!.user.id;
    const morganaId = game.players.find((player) => player.role.role === 'morgana')!.user.id;

    gameHelper
      .moveLadyOfLake(percivalId)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .useLadyOfLake(merlinId)
      .announceLoyalty('good');

    expect(game.visibleRolesState[percivalId][merlinId]).toBe('merlin');
    expect(game.visibleRolesState[percivalId][morganaId]).toBe('morgana');
  });
});
