import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> 1 player play mission card visible
 * effect -> after success vote can use or skip
 *
 * observable always true
 */

/**
 * Problems: display one result visible to everyone
 */
export class WeFoundYouCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'weFoundYou';
  type = <const>'usable';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
