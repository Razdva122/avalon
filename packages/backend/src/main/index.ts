import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary } from '@avalon/types';
import type { Server, ServerSocket } from '@avalon/types';
import crypto from 'crypto';

import { parseCookie, handleSocketErrors } from '@/helpers';

export class Manager {
  rooms: Dictionary<Room> = {};
  io: Server;

  createRoom(uuid: string, leader: User) {
    this.rooms[uuid] = new Room(uuid, leader, this.io);

    // Delete room after 1 day timeout
    setTimeout(() => {
      delete this.rooms[uuid];
    }, 86400000);
  }

  constructor(io: Server) {
    this.io = io;

    io.on('connection', (socket) => {
      handleSocketErrors(socket);

      const { user_id: userID, user_name: userName } = parseCookie(socket.handshake.headers.cookie || '');

      if (userID) {
        socket.join(userID);
      }

      socket.on('joinRoom', (uuid, cb) => {
        console.log(`user ${userName} join room uuid: ${uuid}`);
        const room = this.rooms[uuid];

        if (room) {
          socket.join(uuid);
          cb(this.rooms[uuid].calculateRoomState(userID));
        } else {
          cb({ stage: 'unavailable' });
        }
      });

      if (userID && userName) {
        this.createMethodsForAuthUsers(socket, userID, userName);
        this.createMethodsForGame(socket, userID, userName);
      }

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });
  }

  createMethodsForAuthUsers(socket: ServerSocket, userID: string, userName: string): void {
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
        room.toggleLockedState();
      }
    });

    socket.on('startGame', (uuid, options) => {
      console.log('startGame', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.startGame(options);
      }
    });
  }

  createMethodsForGame(socket: ServerSocket, userID: string, userName: string): void {
    const getRoomManager = (uuid: string) => {
      const room = this.rooms[uuid];
      if (room.data.stage === 'started') {
        return room.data.manager;
      }

      throw new Error(`Room with uuid ${uuid} have wrong stage ${this.rooms[uuid].data.stage}`);
    };

    socket.on('selectPlayer', (uuid, selectedUserID) => {
      console.log(`Player ${selectedUserID} selected by ${userName} in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'selectPlayer', playerID: selectedUserID });
    });

    socket.on('sentSelectedPlayers', (uuid) => {
      console.log(`Player ${userName} send mission in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'sentSelectedPlayers' });
    });

    socket.on('voteForMission', (uuid, option) => {
      console.log(`Player ${userName} vote for mission (${option}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'voteForMission', option });
    });

    socket.on('actionOnMission', (uuid, result) => {
      console.log(`Player ${userName} action in mission (${result}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'actionOnMission', result });
    });

    socket.on('selectMerlin', (uuid) => {
      console.log(`Player ${userName} selectMerlin in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'selectMerlin' });
    });
  }
}
