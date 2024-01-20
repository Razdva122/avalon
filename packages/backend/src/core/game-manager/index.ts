import { Game } from '@/core/game';
import type { User } from '@/user';
import type { TRoomState, TGameMethodsParams, TGetLoyaltyData } from '@/core/game-manager/interface';

import { TGameStage, Server, IVisualGameState, IPlayer, IGameOptions } from '@avalon/types';

export * from '@/core/game-manager/interface';

export class GameManager {
  game: Game;
  roomState!: TRoomState;
  io: Server;
  roomID: string;

  constructor(users: User[], options: IGameOptions, io: Server, roomID: string) {
    this.roomID = roomID;
    this.io = io;
    this.game = new Game(users, options, { gameStateChanged: () => this.gameStateChanged() });
    this.initRoomState();
  }

  /**
   * Initializing the state room
   */
  initRoomState(): void {
    this.roomState = {
      uuid: this.roomID,
      stage: this.game.stage,
      vote: this.game.turn,
      mission: this.game.round,
      settings: this.game.settings,
      players: this.game.players.map((player) => {
        return {
          id: player.user.id,
          name: player.user.name,
          features: player.features,
        };
      }),
      history: this.prepareHistoryForView(),
      ...this.calculatePlayersRoles(this.game.stage),
    };
  }

  /**
   * Handler, the state of the game has changed, need to update the state of the room
   */
  gameStateChanged(): void {
    /**
     * Recalculate the roles if on a new stage, if there is an override for it
     */
    if (this.game.stage !== this.roomState.stage && this.game.stageVisibilityChange[this.game.stage]) {
      this.roomState = {
        ...this.roomState,
        ...this.calculatePlayersRoles(this.game.stage),
      };
    }

    this.roomState.stage = this.game.stage;

    this.roomState.players = this.game.players.map((player) => {
      return {
        id: player.user.id,
        name: player.user.name,
        features: player.features,
      };
    });

    this.roomState.history = this.prepareHistoryForView();

    this.roomState.vote = this.game.turn;

    this.roomState.mission = this.game.round;

    this.sendNewStateToUsers();
  }

  /**
   * Sends the new game state to all users
   */
  sendNewStateToUsers(): void {
    this.game.players.forEach((player) => {
      this.io.to(player.user.id).emit('gameUpdated', this.prepareStateForUser(player.user.id));
    });

    this.io
      .except(this.game.players.map((player) => player.user.id))
      .to(this.roomID)
      .emit('gameUpdated', this.prepareStateForUser());
  }

  /**
   * Calculates the visible roles for all players in the game and available to everyone
   *
   * @param newStage - the stage of the game for which you need to calculate the roles
   */
  calculatePlayersRoles(newStage: TGameStage): Pick<TRoomState, 'publicRoles' | 'roles'> {
    const overrideMethod = this.game.stageVisibilityChange[newStage];

    const publicRoles = this.game.players.map((player) => {
      const overrideRole = overrideMethod ? overrideMethod(newStage, player.role) : false;
      return overrideRole ? player.role.role : 'unknown';
    });

    const roles = this.game.players.reduce<TRoomState['roles']>((acc, observer) => {
      acc[observer.user.id] = this.game.players.map((target) => {
        const overrideRole = overrideMethod ? overrideMethod(newStage, target.role) : false;

        if (overrideRole) {
          return target.role.role;
        }

        if (target === observer) {
          return target.role.selfRole;
        }

        return observer.role.visibility[target.role.role];
      });

      return acc;
    }, {});

    return {
      publicRoles,
      roles,
    };
  }

  /**
   * Transforms the history data into a format for display
   */
  prepareHistoryForView() {
    return this.game.history.map((el) => {
      if (el.type === 'mission' && this.game.stage === 'end') {
        return el.dataForManager({ withResult: true });
      }

      return el.dataForManager({});
    });
  }

  /**
   * Transform a state of rooms into a state for a specific user
   *
   * @param [userId] - the ID of the user to prepare the state for
   */
  prepareStateForUser(userId?: string): IVisualGameState {
    const roles = userId && this.roomState.roles[userId] ? this.roomState.roles[userId] : this.roomState.publicRoles;

    return {
      uuid: this.roomState.uuid,
      stage: this.roomState.stage,
      vote: this.roomState.vote,
      mission: this.roomState.mission,
      settings: this.roomState.settings,
      history: this.roomState.history,
      players: this.roomState.players.map((player, index) => {
        const playerData: IPlayer = { ...player, role: roles[index] };

        if (player.id === userId) {
          playerData.validMissionsResult = this.game.players[index].role.validMissionResult;
        }

        return playerData;
      }),
    };
  }

  callGameMethods(userID: string, params: TGameMethodsParams): void {
    switch (params.method) {
      case 'voteForMission':
        this.game.voteForMission(userID, params.option);
        break;

      case 'selectPlayer':
        this.game.selectPlayer(userID, params.playerID);
        break;

      case 'sentSelectedPlayers':
        this.game.sentSelectedPlayers(userID);
        break;

      case 'actionOnMission':
        this.game.actionOnMission(userID, params.result);
        break;

      case 'selectMerlin':
        if (!this.game.addons.merlin) {
          throw new Error('You cant select merlin in game without merlin addon');
        }

        this.game.addons.merlin.selectMerlin(userID);
        break;

      case 'checkLoyalty':
        if (!this.game.addons.ladyOfLake) {
          throw new Error('You cant use lady of lake in game without lady addon');
        }

        this.game.addons.ladyOfLake.checkLoyalty(userID);
        break;

      case 'announceLoyalty':
        if (!this.game.addons.ladyOfLake) {
          throw new Error('You cant use lady of lake in game without lady addon');
        }

        this.game.addons.ladyOfLake.announceLoyalty(userID, params.loyalty);
        break;
    }
  }

  getGameData<T extends TGetLoyaltyData>(userID: string, params: T['params']): T['result'] {
    switch (params.method) {
      case 'getLoyalty':
        if (!this.game.addons.ladyOfLake) {
          throw new Error('You cant use lady of lake in game without lady addon');
        }

        return this.game.addons.ladyOfLake.getLoyalty(userID);
    }
  }
}
