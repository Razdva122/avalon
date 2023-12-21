import { Game, IGameOptions } from '@/core/game';
import { User } from '@/user';

const users = [
  new User('1', 'Misha'),
  new User('2', 'John'),
  new User('3', 'Dima'),
  new User('4', 'Anna'),
  new User('5', 'Alex'),
  new User('6', 'Ivan'),
  new User('7', 'Tom'),
  new User('8', 'Jack'),
  new User('9', 'Pavel'),
  new User('10', 'Anna'),
];

export class GameTestHelper {
  game!: Game;
  stateChangedNumber: number = 0;

  constructor(playersAmount: number, options: IGameOptions) {
    this.restartGame(playersAmount, options);
  }

  restartGame(playersAmount: number, options: IGameOptions) {
    this.stateChangedNumber = 0;
    this.game = new Game(users.slice(0, playersAmount), options, {
      gameStateChanged: () => (this.stateChangedNumber += 1),
    });
  }

  selectPlayersOnMission(evil: number = 0): this {
    const amount = this.game.currentMission.data.settings.players;
    const evilPlayers = this.game.players.filter((player) => player.role.loyalty === 'evil');

    for (let i = 0; i < amount; i += 1) {
      if (evil > 0) {
        evil -= 1;
        this.game.selectPlayer(evilPlayers[evil].user.id);
      } else {
        const unselectedPlayer = this.game.players.find((player) => player.features.isSelected === false)!;
        this.game.selectPlayer(unselectedPlayer?.user.id);
      }
    }

    return this;
  }

  makeVotes(rejects: number = 0): this {
    this.game.players.forEach((player) => {
      if (player.features.waitForAction) {
        if (rejects > 0) {
          rejects -= 1;
          this.game.voteForMission(player.user.id, 'reject');
        } else {
          this.game.voteForMission(player.user.id, 'approve');
        }
      }
    });

    return this;
  }

  makeActions(fails: number = 0): this {
    this.game.currentMission.data.actions.forEach((action) => {
      if (action.player.features.waitForAction) {
        if (action.player.role.loyalty === 'evil' && fails > 0) {
          this.game.actionOnMission(action.player.user.id, 'fail');
          fails -= 1;
        } else {
          this.game.actionOnMission(action.player.user.id, 'success');
        }
      }
    });

    return this;
  }

  sentSelectedPlayers(): this {
    this.game.sentSelectedPlayers();
    return this;
  }

  pickMerlin(correctMerlin: boolean = false): this {
    const id = this.game.players.find((player) => {
      return correctMerlin ? player.role.role === 'merlin' : player.role.role !== 'merlin';
    })!.user.id;

    this.game.selectPlayer(id);
    this.game.addons.merlin!.selectMerlin();

    return this;
  }
}
