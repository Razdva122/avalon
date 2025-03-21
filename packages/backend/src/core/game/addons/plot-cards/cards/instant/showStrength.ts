import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader get card to himself
 * use -> leader select player to reveal his loyalty
 * effect -> none
 */

/**
 * Problems: -
 */
export class ShowStrengthCard implements IInstantPlotCard {
  name = <const>'showStrength';
  type = <const>'instant';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
