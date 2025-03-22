import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player become leader
 * effect -> before every team selection player can use or skip
 *
 * observable false if used
 */

/**
 * Problems: multi taking charge
 */
export class TakingChargeCard implements IUsablePlotCard {
  name = <const>'takingCharge';
  type = <const>'usable';
  activate: IUsablePlotCard['activate'] = 'select';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  play() {
    return of(true);
  }
}
