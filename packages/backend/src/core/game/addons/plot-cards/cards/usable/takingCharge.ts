import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> player become leader
 * effect -> before every team selection player can use or skip
 */

/**
 * Problems: multi taking charge
 */
export class TakingChargeCard implements IUsablePlotCard {
  name = <const>'takingCharge';
  type = <const>'usable';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
