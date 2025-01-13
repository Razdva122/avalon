import { generateNewGame } from '@/core/game/test/const';
import * as _ from 'lodash';

let { game, gameHelper } = generateNewGame();

describe('Lancelots', () => {
  beforeAll(() => {
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
      expect(lastHistoryEl.data.result).toBe(switches[i]);

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
});
