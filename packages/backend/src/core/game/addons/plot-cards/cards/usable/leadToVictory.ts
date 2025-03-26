import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player become leader
 * effect -> before every team selection player can use or skip
 *
 * observable false if used
 */

/**
 * Problems: multi lead to victory
 */
export class LeadToVictoryCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'leadToVictory';
  type = <const>'usable';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
