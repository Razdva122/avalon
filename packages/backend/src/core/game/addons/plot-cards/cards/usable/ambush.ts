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
    const selectedPlayer = this.game.selectedPlayers[0];
    const ownerOfAmbush = this.game.players.find((player) => player.features.ambushCard === 'active')!;

    if (selectedPlayer) {
      const mission = this.game.currentMission;

      const selectedPlayerAction = mission.data.actions.find((el) => el.player === selectedPlayer);

      if (!selectedPlayerAction) {
        throw new Error('The card can only be used to a mission participant');
      }

      const ambushHistory = new Ambush(ownerOfAmbush, selectedPlayer, selectedPlayerAction.value as TMissionResult);

      this.game.history.push(ambushHistory);
      selectedPlayer.features.isSelected = false;

      this.plotCardsAddon.removeCardFromGame(this);
    }

    ownerOfAmbush.features.waitForAction = false;
    ownerOfAmbush.features.ambushCard = 'has';
    this.ambushSubject.next(true);
  }
}
