import { Room } from '@/room';
import { User } from '@/user';
import type { Dictionary, TRoomInfo, TRoomsList, IGameOptions } from '@avalon/types';
import type { Server, ServerSocket } from '@avalon/types';
import crypto from 'crypto';

import { parseCookie, handleSocketErrors, eventBus } from '@/helpers';
import { fakeGames } from '@/helpers/mocks/game';
import { fakeRooms } from '@/helpers/mocks/rooms';

export class Manager {
  rooms: Dictionary<Room> = {};
  roomsList: TRoomsList = fakeRooms;
  io: Server;

  get roomListCutted() {
    return this.roomsList.slice(0, 20);
  }

  createRoom(uuid: string, leaderID: string, players: User[], options?: IGameOptions) {
    this.rooms[uuid] = new Room(uuid, leaderID, players, this.io, options);

    this.updateRoomsList(this.rooms[uuid]);

    // Delete room after 10 day timeout
    setTimeout(() => {
      delete this.rooms[uuid];
    }, 86400000 * 10);
  }

  updateRoomsList(roomOrID: Room | string, removeRoom: boolean = false) {
    const room = typeof roomOrID === 'string' ? this.rooms[roomOrID] : roomOrID;

    if (!room) {
      return;
    }

    if (removeRoom) {
      this.roomsList = this.roomsList.filter((el) => el.uuid !== room.roomID);
    } else {
      const roomData: TRoomInfo = {
        host: room.players.find((player) => player.id === room.leaderID)?.name ?? 'unknown',
        state: room.data.stage,
        options: room.options,
        startTime: room.startTime,
        createTime: room.createTime,
        uuid: room.roomID,
        players: room.players.length,
      };

      if (room.data.stage === 'started') {
        roomData.result = room.data.manager.game.result;
      }

      const roomIndex = this.roomsList.findIndex((el) => el.uuid === room.roomID);

      if (roomIndex !== -1) {
        this.roomsList[roomIndex] = roomData;
      } else {
        if (this.roomsList.length === 50) {
          this.roomsList.pop();
        }

        this.roomsList.unshift(roomData);
      }
    }

    this.io.to('lobby').emit('roomsListUpdated', this.roomListCutted);
  }

  restartRoom(uuid: string) {
    const room = this.rooms[uuid];

    if (room == null) {
      throw new Error(`Cant find game for restart with uuid ${uuid}`);
    }

    if (room.data.stage === 'started') {
      if (room.data.manager.game.stage === 'end') {
        const newUUID = crypto.randomUUID();
        this.createRoom(newUUID, room.leaderID, room.players, room.options);

        this.io.to(room.roomID).emit('restartGame', newUUID);
      } else {
        throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.manager.game.stage}`);
      }
    } else {
      throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.stage}`);
    }
  }

  constructor(io: Server) {
    this.io = io;

    eventBus.on('roomUpdated', (room) => {
      this.updateRoomsList(room);
    });

    eventBus.on('restartRoom', (room) => {
      this.restartRoom(room.roomID);
    });

    io.on('connection', (socket) => {
      handleSocketErrors(socket);

      const { user_id: userID, user_name: userName } = parseCookie(socket.handshake.headers.cookie || '');

      if (userID) {
        socket.join(userID);
      }

      socket.on('joinRoom', (uuid, cb) => {
        console.log(`user ${userName} join room uuid: ${uuid}`);

        const fakeGame = fakeGames.find((el) => el.roomID === uuid);

        if (fakeGame) {
          cb(fakeGame);
          return;
        }

        const room = this.rooms[uuid];

        if (room) {
          socket.join(uuid);
          cb(this.rooms[uuid].calculateRoomState(userID));
        } else {
          cb({ error: 'errorNotFound' });
        }
      });

      socket.on('getRoomsList', (cb) => {
        socket.join('lobby');
        cb(this.roomListCutted);
      });

      if (userID && userName) {
        this.createMethodsForAuthUsers(socket, userID, userName);
        this.createMethodsForGame(socket, userID, userName);
      }

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });

    setInterval(() => {
      const currentTime = new Date();

      this.roomsList = this.roomsList.filter((el) => {
        const createTime = new Date(el.createTime);
        const minutes = 60 * 1000;

        if (!el.startTime) {
          return (Number(currentTime) - Number(createTime)) / minutes < 30;
        } else {
          const startTime = new Date(el.startTime);

          return (Number(currentTime) - Number(startTime)) / minutes < 600 || el.result?.winner;
        }
      });
    }, 60000 * 30);
  }

  createMethodsForAuthUsers(socket: ServerSocket, userID: string, userName: string): void {
    socket.on('createRoom', (cb) => {
      const uuid = crypto.randomUUID();
      console.log('createRoom', uuid);
      this.createRoom(uuid, userID, [new User(userID, userName)]);
      cb(uuid);
    });

    socket.on('restartGame', (uuid) => {
      console.log(`restart room with uuid: ${uuid}`);
      this.restartRoom(uuid);
    });

    socket.on('leaveRoom', (uuid) => {
      socket.leave(uuid);
      console.log(`user ${userName} leave room uuid: ${uuid}`);
    });

    socket.on('sendMessage', (uuid, message) => {
      console.log(`sendMessage to ${uuid}`, message);
      const room = this.rooms[uuid];

      if (room) {
        room.addMessage(userID, userName, message);
      }
    });

    socket.on('joinGame', (uuid) => {
      console.log('joinGame', uuid);
      const room = this.rooms[uuid];

      if (room) {
        room.joinGame(userID, userName);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('leaveGame', (uuid) => {
      console.log('leaveGame', uuid);
      const room = this.rooms[uuid];

      if (room) {
        room.leaveGame(userID);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('lockRoom', (uuid) => {
      console.log('lockRoom', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.toggleLockedState();
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('updateOptions', (uuid, options) => {
      console.log('updateOptions', uuid, options);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.updateOptions(options);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('endGame', (uuid) => {
      console.log('endGame', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.startVoteFor('endGame');
      }
    });

    socket.on('endAndRestartGame', (uuid) => {
      console.log('endAndRestartGame', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.startVoteFor('endAndRestartGame');
      }
    });

    socket.on('shuffle', (uuid) => {
      console.log('shuffle', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.shuffle();
      }
    });

    socket.on('voteInRoom', (uuid, result) => {
      console.log('voteInRoom', uuid);
      const room = this.rooms[uuid];
      if (room) {
        room.makeVote(userID, result);
      }
    });

    socket.on('startGame', (uuid) => {
      console.log('startGame', uuid);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.startGame();
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('kickPlayer', (uuid, kickUserID) => {
      console.log('kick player', kickUserID);
      const room = this.rooms[uuid];
      if (room.leaderID === userID) {
        room.leaveGame(kickUserID);
        eventBus.emit('roomUpdated', room);
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

    socket.on('assassinate', (uuid, type) => {
      console.log(`Player ${userName} assassinate in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'assassinate', type });
    });

    socket.on('checkLoyalty', (uuid) => {
      console.log(`Player ${userName} checkLoyalty in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'checkLoyalty' });
    });

    socket.on('announceLoyalty', (uuid, loyalty) => {
      console.log(`Player ${userName} announceLoyalty in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'announceLoyalty', loyalty });
    });

    socket.on('getLoyalty', (uuid, cb) => {
      console.log(`Player ${userName} getLoyalty in game ${uuid}`);
      cb(getRoomManager(uuid).getGameData(userID, { method: 'getLoyalty' }));
    });

    socket.on('giveExcalibur', (uuid) => {
      console.log(`Player ${userName} giveExcalibur in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'giveExcalibur' });
    });

    socket.on('useExcalibur', (uuid) => {
      console.log(`Player ${userName} useExcalibur in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useExcalibur' });
    });

    socket.on('useWitchAbility', (uuid, result) => {
      console.log(`Player ${userName} useWitchAbility in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'witchAbility', result });
    });
  }
}
