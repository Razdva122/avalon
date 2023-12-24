import { User } from '@/user';
import type { TRoomState, Server } from '@avalon/types';
import type { TRoomData } from '@/room/interace';

export class Room {
  roomID: string;
  players: User[];
  leaderID: string;
  data: TRoomData = { stage: 'created' };
  maxCapacity = 10;
  io: Server;

  constructor(roomID: string, leader: User, io: Server) {
    this.io = io;
    this.roomID = roomID;
    this.players = [leader];
    this.leaderID = leader.id;
  }

  joinGame(userID: string, name: string) {
    if (this.data.stage !== 'created') {
      return;
    }

    if (!this.players.find((player) => player.id === userID) && this.players.length < this.maxCapacity) {
      this.players.push(new User(userID, name));
      this.updateRoomState();
    }
  }

  leaveGame(userID: string) {
    if (this.data.stage !== 'created') {
      return;
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

  updateRoomState() {
    this.io.to(this.roomID).emit('roomUpdated', this.calculateRoomState());
  }

  startGame() {
    this.data = { stage: 'started' };
    this.updateRoomState();
  }

  calculateRoomState(): TRoomState {
    return {
      stage: this.data.stage,
      roomID: this.roomID,
      leaderID: this.leaderID,
      players: this.players.map(({ name, id }) => ({ name, id })),
    };
  }

  protected destroyRoom() {
    // TODO
  }
}
