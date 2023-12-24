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
      const { user_id: userID, user_name: userName } = parseCookie(socket.handshake.headers.cookie || '');

      console.log('user connected', userID, userName);

      if (userID) {
        socket.join(userID);
      }

      socket.on('joinRoom', (uuid, cb) => {
        console.log(`user ${userName} join room uuid: ${uuid}`);
        const room = this.rooms[uuid];

        if (room) {
          socket.join(uuid);
          cb(this.rooms[uuid].calculateRoomState());
        } else {
          cb({ stage: 'unavailable' });
        }
      });

      if (userID && userName) {
        socket.on('createRoom', (cb) => {
          const uuid = crypto.randomUUID();
          console.log('createRoom', uuid);
          this.createRoom(uuid, new User(userID, userName));
          cb(uuid);
        });

        socket.on('leaveRoom', (uuid) => {
          socket.leave(uuid);
          console.log(`user ${userName} leave room uuid: ${uuid}`);
        });

        socket.on('joinGame', (uuid) => {
          console.log('joinGame', uuid);
          this.rooms[uuid].joinGame(userID, userName);
        });

        socket.on('leaveGame', (uuid) => {
          console.log('leaveGame', uuid);
          this.rooms[uuid].leaveGame(userID);
        });

        socket.on('lockRoom', (uuid) => {
          console.log('lockRoom', uuid);
          const room = this.rooms[uuid];
          if (room.leaderID === userID) {
            this.rooms[uuid].toggleLockedState();
          }
        });
      }

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
