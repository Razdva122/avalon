import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary } from '@avalon/types';

export class Manager {
  rooms: Dictionary<Room> = {};

  isRoomExist(uuid: string): boolean {
    return Boolean(this.rooms[uuid]);
  }

  createRoom(uuid: string, leader: User) {
    this.rooms[uuid] = new Room(uuid, leader);
  }
}
