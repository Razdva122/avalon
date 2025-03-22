import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';
import { of } from 'rxjs';

/**
 * activate -> leader give card to some one
 * use -> player see mission action of one player
 * effect -> after end of actions can skip or use
 *
 * observable always true
 */

/**
 * Problems: multi staying alert returns in game, duplicate checks unavailable
 */
export class StayingAlertCard implements IUsablePlotCard {
  name = <const>'stayingAlert';
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
