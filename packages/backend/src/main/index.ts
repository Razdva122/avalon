import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary } from '@avalon/types';
import type { Server, Socket } from 'socket.io';

export class Manager {
  rooms: Dictionary<Room> = {};
  socket!: Socket;

  constructor(io: Server) {
    io.on('connection', (socket) => {
      this.socket = socket;

      console.log(socket.handshake.headers);

      socket.on('joinRoom', (uuid) => {
        console.log(`user ${socket.handshake.headers.cookie} join uuid: ${uuid}`);
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });
  }

  isRoomExist(uuid: string): boolean {
    return Boolean(this.rooms[uuid]);
  }

  createRoom(uuid: string, leader: User) {
    this.rooms[uuid] = new Room(uuid, leader);
  }
}
