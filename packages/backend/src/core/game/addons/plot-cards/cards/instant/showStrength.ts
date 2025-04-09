import { LoyaltyPlotCard } from '@/core/game/addons/plot-cards/cards/abstract';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

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
export class ShowStrengthCard extends LoyaltyPlotCard implements IInstantPlotCard {
  name = <const>'showStrength';
  type = <const>'instant';
  override activate: LoyaltyPlotCard['activate'] = 'self';
  loyaltyType = <const>'revealLoyalty';
}
