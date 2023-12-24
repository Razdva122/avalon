import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary } from '@avalon/types';
import type { Server } from '@avalon/types';
import crypto from 'crypto';

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

      socket.on('createRoom', (cb) => {
        const uuid = crypto.randomUUID();
        console.log('createRoom', uuid);
        this.createRoom(uuid, new User(cookie['user_id'], cookie['user_name']));
        cb(uuid);
      });

      socket.on('joinRoom', (uuid, cb) => {
        console.log(`user ${cookie.user_name} join room uuid: ${uuid}`);
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
        console.log(`user ${cookie.user_name} leave room uuid: ${uuid}`);
      });

      socket.on('joinGame', (uuid) => {
        console.log('joinGame', uuid);
        this.rooms[uuid].joinGame(cookie['user_id'], cookie['user_name']);
      });

      socket.on('leaveGame', (uuid) => {
        console.log('leaveGame', uuid);
        this.rooms[uuid].leaveGame(cookie['user_id']);
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
