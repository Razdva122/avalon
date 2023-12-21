import type { User } from '@/user';
import type { TRoomState } from '@/room/interace';

export class Room {
  roomID: string;
  users: User[];
  leaderID: string;
  state: TRoomState = { stage: 'generated' };
  maxCapacity = 10;

  constructor(roomID: string, leader: User) {
    this.roomID = roomID;
    this.users = [leader];
    this.leaderID = leader.id;
  }

  joinRoom(user: User) {
    if (this.state.stage !== 'generated') {
      return;
    }

    if (!this.users.includes(user) && this.users.length < this.maxCapacity) {
      this.users.push(user);
    }
  }

  leaveRoom(user: User) {
    if (this.state.stage !== 'generated') {
      return;
    }

    if (this.users.includes(user)) {
      this.users.splice(this.users.indexOf(user), 1);
    }

    if (user.id === this.leaderID) {
      if (this.users.length === 0) {
        this.destroyRoom();
      } else {
        this.leaderID = this.users[0].id;
      }
    }
  }

  toggleLockedState() {
    if (this.state.stage === 'generated') {
      this.state = { stage: 'locked' };
    } else if (this.state.stage === 'locked') {
      this.state = { stage: 'generated' };
    }
  }

  protected destroyRoom() {
    // TODO
  }
}
