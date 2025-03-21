import { Game } from '@/core/game';
import { IUsablePlotCard } from '@/core/game/addons/plot-cards/interface';

/**
 * activate -> leader give card to some one
 * use -> player see mission action of one player
 * effect -> after end of actions can skip or use
 */

/**
 * Problems: multi staying alert returns in game, duplicate checks unavailable
 */
export class StayingAlertCard implements IUsablePlotCard {
  name = <const>'stayingAlert';
  type = <const>'usable';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
