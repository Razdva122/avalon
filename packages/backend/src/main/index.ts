import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary } from '@avalon/types';
import type { Server } from 'socket.io';

import { parseCookie } from '@/helpers';

export class Manager {
  rooms: Dictionary<Room> = {};
  io: Server;

  constructor(io: Server) {
    this.io = io;

    io.on('connection', (socket) => {
      const cookie = parseCookie(socket.handshake.headers.cookie || '');

      if (cookie['user_id']) {
        socket.join(cookie['user_id']);
      }

      socket.on('joinRoom', (uuid, cb) => {
        console.log(`user ${socket.handshake.headers.cookie} join uuid: ${uuid}`);
        const room = this.rooms[uuid];

        if (room) {
          socket.join(uuid);
          cb(this.rooms[uuid].calculateRoomState());
        } else {
          cb({ stage: 'unavailable' });
        }
      });

      socket.on('leaveRoom', (uuid) => {
        socket.leave(uuid);
        console.log(`user ${socket.handshake.headers.cookie} leave uuid: ${uuid}`);
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
    this.rooms[uuid] = new Room(uuid, leader, this.io);
  }
}
