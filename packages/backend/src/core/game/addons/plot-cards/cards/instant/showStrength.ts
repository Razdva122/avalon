import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader get card to himself
 * use -> leader select player to reveal his loyalty
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: -
 */
export class ShowStrengthCard implements IInstantPlotCard {
  name = <const>'showStrength';
  type = <const>'instant';
  activate: IInstantPlotCard['activate'] = 'self';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  play() {
    return of(true);
  }
}
