import { IGameAddon } from '@/core/game/addons/interface';
import { Game } from '@/core/game';
import type { TSwitchesArray } from '@/core/game/addons/lancelots/interface';
import { SwitchLancelots } from '@/core/game/addons/lancelots/switch-lancelots';
import * as _ from 'lodash';

export class LancelotsAddon implements IGameAddon {
  addonName = 'lancelots';
  switches: TSwitchesArray;
  game: Game;

  constructor(game: Game) {
    this.game = game;
    this.switches = _.shuffle([true, true, false, false, false]);
  }

  beforeSelectTeam() {
    if (this.game.turn === 0 && this.game.round >= 2) {
      this.game.stage = 'switchLancelots';
      const currentSwitch = this.switches.shift()!;
      const goodLancelot = this.game.players.find((player) => player.role.role === 'goodLancelot')!;
      const evilLancelot = this.game.players.find((player) => player.role.role === 'evilLancelot')!;

      const switchLancelots = new SwitchLancelots(goodLancelot, evilLancelot, currentSwitch);

      this.game.history.push(switchLancelots);

      if (currentSwitch) {
        const goodLancelotRole = goodLancelot.role;
        const evilLancelotRole = evilLancelot.role;
        const goodLancelotVisibilty = goodLancelotRole.visibility;
        const evilLancelotVisibilty = evilLancelotRole.visibility;

        goodLancelot.role = evilLancelotRole;
        goodLancelot.role.visibility = evilLancelotVisibilty;
        evilLancelot.role = goodLancelotRole;
        evilLancelot.role.visibility = goodLancelotVisibilty;
      }

      this.game.stateObserver.gameStateChanged();
    }

    return true;
  }
}
