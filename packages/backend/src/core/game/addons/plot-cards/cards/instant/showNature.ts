import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player reveal his loyalty to some one
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: -
 */
export class ShowNatureCard extends AbstractCard implements IInstantPlotCard {
  name = <const>'showNature';
  type = <const>'instant';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
