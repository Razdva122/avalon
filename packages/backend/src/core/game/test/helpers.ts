import { Game } from '@/core/game';
import { IGameOptions, TLoyalty } from '@avalon/types';
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

  selectPlayersOnMission(evil: number = 0, extraPlayers = 0): this {
    const amount = this.game.currentMission.data.settings.players + extraPlayers;
    const evilPlayers = this.game.players.filter((player) => player.role.validMissionResult.includes('fail'));

    for (let i = 0; i < amount; i += 1) {
      if (evil > 0) {
        evil -= 1;
        this.game.selectPlayer(this.game.leader.user.id, evilPlayers[evil].user.id);
      } else {
        const unselectedPlayer = this.game.players.find(
          (player) => player.features.isSelected === false && player.role.validMissionResult.includes('success'),
        )!;
        this.game.selectPlayer(this.game.leader.user.id, unselectedPlayer?.user.id);
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
    this.game.sentSelectedPlayers(this.game.leader.user.id);
    return this;
  }

  pickMerlin(correctMerlin: boolean = false): this {
    const id = this.game.players.find((player) => {
      return correctMerlin
        ? player.role.role === 'merlin'
        : player.role.role !== 'merlin' && player.role.loyalty !== 'evil';
    })!.user.id;

    const assassinID = this.game.players.find((player) => {
      return player.features.isAssassin;
    })!.user.id;

    this.game.selectPlayer(assassinID, id);
    this.game.addons.assassin!.assassinate(assassinID, 'merlin');

    return this;
  }

  pickLovers(correctLovers: Array<'isolde' | 'tristan'> = []): this {
    const ids: string[] = [];

    correctLovers.forEach((el) => {
      ids.push(this.game.players.find((player) => player.role.role === el)!.user.id);
    });

    const assassinID = this.game.players.find((player) => {
      return player.features.isAssassin;
    })!.user.id;

    ids.forEach((id) => {
      this.game.selectPlayer(assassinID, id);
    });

    while (this.game.selectedPlayers.length < 2) {
      const playerToSelectId = this.game.players.find(
        (player) =>
          player.role.role !== 'isolde' &&
          player.role.role !== 'tristan' &&
          !player.features.isSelected &&
          player.role.loyalty !== 'evil',
      )!.user.id;

      this.game.selectPlayer(assassinID, playerToSelectId);
    }

    this.game.addons.assassin!.assassinate(assassinID, 'lovers');

    return this;
  }

  useLadyOfLake(): this {
    const randomPlayerID = this.game.players.find((player) => player.features.ladyOfLake === undefined)!.user.id;

    const ownerID = this.game.players.find((player) => {
      return player.features.ladyOfLake == 'has';
    })!.user.id;

    this.game.selectPlayer(ownerID, randomPlayerID);
    this.game.addons.ladyOfLake!.checkLoyalty(ownerID);
    return this;
  }

  announceLoyalty(loyalty: TLoyalty): this {
    const id = this.game.players.find((player) => {
      return player.features.ladyOfLake == 'has';
    })!.user.id;

    this.game.addons.ladyOfLake!.announceLoyalty(id, loyalty);
    return this;
  }

  giveExcalibur(giveExcalibur: true | string = true): this {
    const playerToExcalibur =
      giveExcalibur === true
        ? this.game.players.find((player) => player.features.isSent && !player.features.isLeader)
        : this.game.players.find((player) => player.user.id === giveExcalibur);

    this.game.selectPlayer(this.game.leader.user.id, playerToExcalibur!.user.id);

    this.game.addons.excalibur!.giveExcalibur(this.game.leader.user.id);

    return this;
  }

  useExcalibur(useExcalibur: boolean = true, useOnSuccess: boolean = true): this {
    const playerWithExcaliburId = this.game.players.find((player) => player.features.excalibur)!.user.id;

    if (useExcalibur) {
      const actionWithCorrectRes = this.game.currentMission.data.actions.find((action) => {
        return useOnSuccess ? action.value === 'success' : action.value === 'fail' && !action.player.features.excalibur;
      })!;

      this.game.selectPlayer(playerWithExcaliburId, actionWithCorrectRes.player.user.id);
    }

    this.game.addons.excalibur!.useExcalibur(playerWithExcaliburId);

    return this;
  }

  useWitchAbility(result: boolean = true): this {
    const playerWitchId = this.game.players.find((player) => player.role.role === 'witch')!.user.id;

    this.game.addons.witch!.useWitchAbility(playerWitchId, result);

    return this;
  }
}
