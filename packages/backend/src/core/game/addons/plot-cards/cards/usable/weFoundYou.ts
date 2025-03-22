import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> 1 player play mission card visible
 * effect -> after success vote can use or skip
 *
 * observable always true
 */

/**
 * Problems: display one result visible to everyone
 */
export class WeFoundYouCard implements IUsablePlotCard {
  name = <const>'weFoundYou';
  activate: IUsablePlotCard['activate'] = 'select';
  type = <const>'usable';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  play() {
    return of(true);
  }
}
