import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player reveal loyalty of left or right player
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: -
 */
export class AreYouTheOneCard extends AbstractCard implements IInstantPlotCard {
  name = <const>'areYouTheOne';
  type = <const>'instant';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
