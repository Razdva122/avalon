import { IGameAddon } from '@/core/game/addons/interface';
import { Game } from '@/core/game';
import type { TSwitchesArray } from '@/core/game/addons/lancelots/interface';
import { SwitchLancelotsHistory } from '@/core/game/addons/lancelots/switch-lancelots';
import * as _ from 'lodash';
import { of } from 'rxjs';

export class LancelotsAddon implements IGameAddon {
  addonName = 'lancelots';
  switches: TSwitchesArray;
  pointer: number = 0;
  game: Game;

  constructor(game: Game) {
    this.game = game;
    this.switches = _.shuffle([true, true, false, false, false]);
  }

  beforeSelectTeam() {
    if (this.game.turn === 0 && this.game.round >= 2) {
      this.game.stage = 'switchLancelots';
      const currentSwitch = this.switches[this.pointer];
      const goodLancelot = this.game.players.find((player) => player.role.selfRole === 'goodLancelot')!;
      const evilLancelot = this.game.players.find((player) => player.role.selfRole === 'evilLancelot')!;

      const switchLancelots = new SwitchLancelotsHistory(goodLancelot, evilLancelot, this.pointer, this.switches);

      this.game.history.push(switchLancelots);

      if (currentSwitch) {
        goodLancelot.role.role = 'evilLancelot';
        goodLancelot.role.selfRole = 'evilLancelot';
        goodLancelot.role.loyalty = 'evil';
        evilLancelot.role.role = 'goodLancelot';
        evilLancelot.role.selfRole = 'goodLancelot';
        evilLancelot.role.loyalty = 'good';
        this.updateRolesVisibility();
      }

      this.game.stateObserver.gameStateChanged();
      this.pointer += 1;
    }

    return of(true);
  }

  updateRolesVisibility() {
    Object.entries(this.game.visibleRolesState).forEach(([id, value]) => {
      Object.entries(value).forEach(([targetId, role]) => {
        if (role === 'evilLancelot') {
          this.game.updateVisibleRolesState(id, { [targetId]: 'goodLancelot' });
        }

        if (role === 'goodLancelot') {
          this.game.updateVisibleRolesState(id, { [targetId]: 'evilLancelot' });
        }
      });
    });
  }
}
