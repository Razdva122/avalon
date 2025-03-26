import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

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

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
