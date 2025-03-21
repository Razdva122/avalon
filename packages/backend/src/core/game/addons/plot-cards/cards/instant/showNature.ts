import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> player reveal his loyalty to some one
 * effect -> none
 */

/**
 * Problems: -
 */
export class ShowNatureCard implements IInstantPlotCard {
  name = <const>'showNature';
  type = <const>'instant';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
