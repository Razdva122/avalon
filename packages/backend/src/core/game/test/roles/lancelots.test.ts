import { generateNewGame } from '@/core/game/test/const';
import * as _ from 'lodash';
import { SwitchLancelotsHistory } from '@/core/game/addons/lancelots/switch-lancelots';

let { game, gameHelper } = generateNewGame();

describe('Lancelots', () => {
  beforeEach(() => {
    const restart = generateNewGame({}, { evilLancelot: 1, goodLancelot: 1, guinevere: 1 });
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('After second mission lancelots start switches', () => {
    const switches = game.addons.lancelots!.switches.slice(0, 3);
    let goodLancelot = game.players.find((player) => player.role.selfRole === 'goodLancelot')!;
    let evilLancelot = game.players.find((player) => player.role.selfRole === 'evilLancelot')!;

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
      const lastHistoryEl = _.last(game.history)!;

      expect(lastHistoryEl.type).toBe('switchLancelots');
      expect((<SwitchLancelotsHistory>lastHistoryEl).data.result).toBe(switches[i]);

      expect(goodLancelot.role.loyalty).toBe(switches[i] ? 'evil' : 'good');
      expect(evilLancelot.role.loyalty).toBe(switches[i] ? 'good' : 'evil');
      expect(goodLancelot.role.selfRole).toBe(switches[i] ? 'evilLancelot' : 'goodLancelot');
      expect(evilLancelot.role.selfRole).toBe(switches[i] ? 'goodLancelot' : 'evilLancelot');

      if (switches[i]) {
        const temp = goodLancelot;
        goodLancelot = evilLancelot;
        evilLancelot = temp;
      }

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();
    }
  });

  test('If lancelots change roles minions should see new state', () => {
    const minions = game.players.filter((player) => player.role.role === 'minion');
    const evilLancelotId = game.players.find((player) => player.role.selfRole === 'evilLancelot')!.userID;

    game.addons.lancelots!.switches = [true, true, true, false, false];

    gameHelper
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1)
      .selectPlayersOnMission(1)
      .sentSelectedPlayers()
      .makeVotes()
      .makeActions(1);

    minions.forEach((minion) => {
      expect(game.visibleRolesState[minion.userID][evilLancelotId]).toBe('goodLancelot');
    });
  });
});
