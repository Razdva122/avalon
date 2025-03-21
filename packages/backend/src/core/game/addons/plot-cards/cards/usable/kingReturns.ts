import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> can decline voting and move leader
 * effect -> after every success voting use or skip
 */

/**
 * Problems: multi kings returns in game
 */
export class KingReturnsCard implements IUsablePlotCard {
  name = <const>'kingReturns';
  type = <const>'usable';
  activate: IUsablePlotCard['activate'] = 'select';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
