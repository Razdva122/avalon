import { LoyaltyPlotCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

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
export class ShowNatureCard extends LoyaltyPlotCard implements IInstantPlotCard {
  name = <const>'showNature';
  type = <const>'instant';
  loyaltyType = <const>'revealLoyalty';
}
