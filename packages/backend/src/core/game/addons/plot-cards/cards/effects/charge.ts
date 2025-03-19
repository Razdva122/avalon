import { Game } from '@/core/game';

export class ChargeCard {
  name = <const>'charge';
  type = 'effect';
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }
}
