import { Game } from '@/core/game';
import { IInstantPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player take plot card from some one
 * effect -> none
 *
 * observable always true
 */

/**
 * Problems: skip stage if another players dont have plot cards
 */
export class RestoreHonorCard implements IInstantPlotCard {
  name = <const>'restoreHonor';
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
