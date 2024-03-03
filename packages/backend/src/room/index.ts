import { User } from '@/user';
import type { TRoomState, Server, IGameOptions } from '@avalon/types';
import type { TRoomData } from '@/room/interace';
import { GameManager } from '@/core/game-manager';

export class Room {
  roomID: string;
  players: User[];
  leaderID: string;
  data: TRoomData = { stage: 'created' };
  maxCapacity = 10;
  io: Server;

  constructor(roomID: string, leaderID: string, players: User[], io: Server) {
    this.io = io;
    this.roomID = roomID;
    this.players = players;
    this.leaderID = leaderID;
  }

  joinGame(userID: string, name: string) {
    if (this.data.stage !== 'created') {
      throw new Error(`${userID} try to join game with id ${this.roomID} with stage ${this.data.stage}`);
    }

    if (!this.players.find((player) => player.id === userID) && this.players.length < this.maxCapacity) {
      this.players.push(new User(userID, name));
      this.updateRoomState();
    }
  }

  leaveGame(userID: string) {
    if (this.data.stage === 'started') {
      throw new Error(`${userID} try to leave game with id ${this.roomID} with stage 'started'`);
    }

    const userIndex = this.players.findIndex((player) => player.id === userID);

    if (userIndex !== -1) {
      this.players.splice(userIndex, 1);
    }

    if (userID === this.leaderID) {
      if (this.players.length === 0) {
        this.destroyRoom();
      } else {
        this.leaderID = this.players[0].id;
      }
    }

    this.updateRoomState();
  }

  toggleLockedState() {
    if (this.data.stage === 'created') {
      this.data = { stage: 'locked' };
    } else if (this.data.stage === 'locked') {
      this.data = { stage: 'created' };
    }

    this.updateRoomState();
  }

  updateRoomState(direct: boolean = false) {
    if (direct) {
      this.players.forEach((player) => {
        this.io.to(player.id).emit('roomUpdated', this.calculateRoomState(player.id));
      });

      this.io
        .except(this.players.map((player) => player.id))
        .to(this.roomID)
        .emit('roomUpdated', this.calculateRoomState());
    } else {
      this.io.to(this.roomID).emit('roomUpdated', this.calculateRoomState());
    }
  }

  startGame(options: IGameOptions) {
    this.data = { stage: 'started', manager: new GameManager(this.players, options, this.io, this.roomID) };
    this.updateRoomState(true);
  }

  calculateRoomState(userID?: string): TRoomState {
    const roomState = {
      roomID: this.roomID,
      leaderID: this.leaderID,
      players: this.players.map(({ name, id }) => ({ name, id, isLeader: id === this.leaderID })),
    };

    if (this.data.stage === 'started') {
      return {
        ...roomState,
        stage: this.data.stage,
        game: this.data.manager.prepareStateForUser(userID),
      };
    } else {
      return {
        ...roomState,
        stage: this.data.stage,
      };
    }
  }

  protected destroyRoom() {
    // TODO
  }
}
