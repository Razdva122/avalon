import { LoyaltyPlotCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

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
export class AreYouTheOneCard extends LoyaltyPlotCard implements IInstantPlotCard {
  name = <const>'areYouTheOne';
  type = <const>'instant';
  loyaltyType = <const>'checkLoyalty';
}
