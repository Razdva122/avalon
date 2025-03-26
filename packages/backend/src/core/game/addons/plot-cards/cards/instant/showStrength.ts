import { AbstractCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader get card to himself
 * use -> leader select player to reveal his loyalty
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: -
 */
export class ShowStrengthCard extends AbstractCard implements IInstantPlotCard {
  name = <const>'showStrength';
  type = <const>'instant';
  override activate: AbstractCard['activate'] = 'self';

  play(ownerID: string) {
    this.activateCard(ownerID);
    this.game.stateObserver.gameStateChanged();
    return of(true);
  }
}
