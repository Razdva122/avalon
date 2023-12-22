import type { User } from '@/user';
import type { TRoomState } from '@/room/interace';
import type { Server } from 'socket.io';

export class Room {
  roomID: string;
  players: User[];
  leaderID: string;
  state: TRoomState = { stage: 'created' };
  maxCapacity = 10;
  io: Server;

  constructor(roomID: string, leader: User, io: Server) {
    this.io = io;
    this.roomID = roomID;
    this.players = [leader];
    this.leaderID = leader.id;
  }

  joinGame(user: User) {
    if (this.state.stage !== 'created') {
      return;
    }

    if (!this.players.includes(user) && this.players.length < this.maxCapacity) {
      this.players.push(user);
    }
  }

  leaveGame(user: User) {
    if (this.state.stage !== 'created') {
      return;
    }

    if (this.players.includes(user)) {
      this.players.splice(this.players.indexOf(user), 1);
    }

    if (user.id === this.leaderID) {
      if (this.players.length === 0) {
        this.destroyRoom();
      } else {
        this.leaderID = this.players[0].id;
      }
    }
  }

  toggleLockedState() {
    if (this.state.stage === 'created') {
      this.state = { stage: 'locked' };
    } else if (this.state.stage === 'locked') {
      this.state = { stage: 'created' };
    }
  }

  updateRoomState() {}

  calculateRoomState() {
    return {
      stage: this.state.stage,
      roomID: this.roomID,
      leaderID: this.leaderID,
      players: this.players.map(({ name, id }) => ({ name, id })),
    };
  }

  protected destroyRoom() {
    // TODO
  }
}
