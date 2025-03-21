import { Game } from '@/core/game';
import { IEffectPlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> none
 * effect -> before voting start extra stage
 */

/**
 * Problems: extra voting stage before original
 */
export class ChargeCard implements IEffectPlotCard {
  name = <const>'charge';
  type = <const>'effect';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
