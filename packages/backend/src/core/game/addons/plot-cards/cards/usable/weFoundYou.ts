import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> 1 player play mission card visible
 * effect -> after success vote can use or skip
 */

/**
 * Problems: display one result visible to everyone
 */
export class WeFoundYouCard implements IUsablePlotCard {
  name = <const>'weFoundYou';
  type = <const>'usable';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
