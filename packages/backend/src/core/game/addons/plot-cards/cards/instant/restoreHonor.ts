import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player take plot card from some one
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: skip stage if another players dont have plot cards
 */
export class RestoreHonorCard extends AbstractCard implements IInstantPlotCard {
  name = <const>'restoreHonor';
  type = <const>'instant';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
