import { Game, IGameOptions } from '@/core/game';
import type { User } from '@/user';
import type { TRoomState, TGameMethodsParams } from '@/core/game-manager/interface';

import { TGameStage, Server, IVisualGameState } from '@avalon/types';

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
      stage: this.game.stage,
      vote: this.game.turn,
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
      stage: this.roomState.stage,
      vote: this.roomState.vote,
      settings: this.roomState.settings,
      history: this.roomState.history,
      players: this.roomState.players.map((player, index) => ({ ...player, role: roles[index] })),
    };
  }

  callGameMethods(userID: string, params: TGameMethodsParams): void {
    const validateUserIsLeader = () => {
      if (this.game.leader.user.id !== userID) {
        throw new Error(`User with userID: ${userID} not a leader`);
      }
    };

    switch (params.method) {
      case 'voteForMission':
        this.game.voteForMission(userID, params.option);
        break;

      case 'selectPlayer':
        validateUserIsLeader();
        this.game.selectPlayer(params.playerID);
        break;

      case 'sentSelectedPlayers':
        validateUserIsLeader();
        this.game.sentSelectedPlayers();
        break;

      case 'actionOnMission':
        this.game.actionOnMission(userID, params.result);
        break;

      case 'selectMerlin':
        if (!this.game.addons.merlin) {
          throw new Error('You cant select merlin in game without merlin addon');
        }

        if (!this.game.players.find((player) => player.user.id === userID)?.features.isAssassin) {
          throw new Error('Only Assassin can select merlin');
        }

        this.game.addons.merlin.selectMerlin();
        break;
    }
  }
}
