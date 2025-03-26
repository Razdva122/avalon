import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> can decline voting and move leader
 * effect -> after every success voting use or skip
 *
 * observable false if used
 */

/**
 * Problems: multi kings returns in game
 */
export class KingReturnsCard extends AbstractCard implements IUsablePlotCard {
  name = <const>'kingReturns';
  type = <const>'usable';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
