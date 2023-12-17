import { Game, IGameOptions } from '@/game';
import type { User } from '@/user';
import type { TRoomState } from '@/game-manager/interface';

export * from '@/game-manager/interface';

export class GameManager {
  game: Game;
  roomState!: TRoomState;

  constructor(users: User[], options: IGameOptions) {
    this.game = new Game(users, options, { gameStateChanged: () => this.gameStateChanged });
    this.initRoomState();
  }

  gameStateChanged(): void {}

  initRoomState(): void {
    this.roomState = {
      stage: this.game.stage,
      history: [],
      settings: this.game.settings,
      players: this.game.players.map((player) => {
        return {
          id: player.user.id,
          name: player.user.name,
          features: player.features,
        };
      }),
      roles: this.game.players.reduce<TRoomState['roles']>((acc, el) => {
        acc[el.user.id] = this.game.players.map((player) => {
          if (player === el) {
            return player.role.selfRole;
          }

          return el.role.visibility[player.role.role];
        });
        return acc;
      }, {}),
      publicRoles: this.game.players.map(() => 'unknown'),
    };
  }

  calculatePlayersState() {}
}
