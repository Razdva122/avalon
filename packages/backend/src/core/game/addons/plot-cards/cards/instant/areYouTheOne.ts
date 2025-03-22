import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player reveal loyalty of left or right player
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: -
 */
export class AreYouTheOneCard implements IInstantPlotCard {
  name = <const>'areYouTheOne';
  type = <const>'instant';
  activate: IInstantPlotCard['activate'] = 'select';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  play() {
    return of(true);
  }
}
