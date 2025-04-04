import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Subject } from 'rxjs';
import { TMissionResult } from '@avalon/types';
import { Ambush } from '@/core/game/addons/plot-cards/history/ambush';

/**
 * activate -> leader give card to some one
 * use -> player see mission action of one player
 * effect -> after end of actions can skip or use
 *
 * observable always true
 */

/**
 * Problems: multi ambush returns in game, duplicate checks unavailable
 */

export class AmbushCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'ambush';
  type = <const>'usable';
  ambushSubject: Subject<true> = new Subject();

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stage = 'ambush';
    this.game.stateObserver.gameStateChanged();
    return this.ambushSubject.asObservable();
  }

  ambush() {
    if (this.game.stage !== 'ambush') {
      throw new Error(`You cant use ambush on stage: ${this.game.stage}`);
    }

    const selectedPlayer = this.game.selectedPlayers[0];
    const ownerOfAmbush = this.game.findPlayerByID(this.ownerID!);

    if (selectedPlayer) {
      const mission = this.game.currentMission;

      const selectedPlayerAction = mission.data.actions.find((el) => el.player === selectedPlayer);

      if (!selectedPlayerAction) {
        throw new Error('The card can only be used to a mission participant');
      }

      if (this.plotCardsAddon.crossCardsStorage.ambushUsedOn.includes(selectedPlayer.user.id)) {
        throw new Error('This player has already been checked by another «ambush» card.');
      }

      const ambushHistory = new Ambush(ownerOfAmbush, selectedPlayer, selectedPlayerAction.value as TMissionResult);

      this.game.history.push(ambushHistory);
      selectedPlayer.features.isSelected = false;
      this.plotCardsAddon.crossCardsStorage.ambushUsedOn.push(selectedPlayer.user.id);

      this.plotCardsAddon.removeCardFromGame(this);
    } else {
      this.stage = 'has';
    }

    ownerOfAmbush.features.waitForAction = false;
    this.ambushSubject.next(true);
  }
}
