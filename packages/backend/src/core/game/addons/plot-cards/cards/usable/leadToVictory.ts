import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { Subject, of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player become leader
 * effect -> before every team selection player can use or skip
 */

/**
 * Problems: multi lead to victory
 */
export class LeadToVictoryCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'leadToVictory';
  type = <const>'usable';
  leadToVictorySubject: Subject<true> = new Subject();

  play(ownerID: string) {
    if (ownerID === this.game.leader.user.id) {
      return of(true);
    }

    this.activateCard(ownerID);
    this.game.stage = 'leadToVictory';
    this.game.leader.features.waitForAction = false;
    this.game.stateObserver.gameStateChanged();
    return this.leadToVictorySubject.asObservable();
  }

  leadToVictory(playerID: string, use: boolean) {
    const player = this.game.findPlayerByID(playerID);
    player.features.leadToVictoryCard = 'has';

    if (use) {
      this.game.leader = player;
      this.plotCardsAddon.removeCardFromGame(this);
    } else {
      player.features.waitForAction = false;
      this.game.leader.features.waitForAction = true;
    }

    this.game.stateObserver.gameStateChanged();
    this.leadToVictorySubject.next(true);
  }
}
