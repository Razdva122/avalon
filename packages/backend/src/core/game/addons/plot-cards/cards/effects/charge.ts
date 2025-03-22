import { Game } from '@/core/game';
import { IEffectPlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> none
 * effect -> before voting start extra stage
 *
 * observable always false create new vote by care
 */

/**
 * Problems: extra voting stage before original
 */
export class ChargeCard implements IEffectPlotCard {
  name = <const>'charge';
  type = <const>'effect';
  activate: IEffectPlotCard['activate'] = 'select';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  play() {
    return of(true);
  }
}
