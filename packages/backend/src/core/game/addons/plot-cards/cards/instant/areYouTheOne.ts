import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> player reveal loyalty of left or right player
 * effect -> none
 */

/**
 * Problems: -
 */
export class AreYouTheOneCard implements IInstantPlotCard {
  name = <const>'areYouTheOne';
  type = <const>'instant';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
