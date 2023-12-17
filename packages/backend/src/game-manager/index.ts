import { Game, IGameOptions } from '@/game';
import type { User } from '@/user';

export class GameManager {
  game: Game;

  constructor(users: User[], options: IGameOptions) {
    this.game = new Game(users, options, { gameStateChanged: () => this.gameStateChanged });
  }

  gameStateChanged(): void {}
}
