import { Room } from '@/room';
import type {
  Dictionary,
  TRoomInfo,
  TRoomsList,
  GameOptions,
  StartedRoomState,
  TLoyalty,
  TRoles,
  TVoteOption,
} from '@avalon/types';
import type { Server, ServerSocket } from '@avalon/types';
import crypto from 'crypto';

import { handleSocketErrors, eventBus } from '@/helpers';
import { registerRatingEndpoints } from '@/scripts/ratingEndpoints';
import { DBManager } from '@/db';
import { validateJWT } from '@/user';
import { AvatarsManager } from '@/user/avatars';

export class Manager {
  rooms: Dictionary<Room> = {};
  roomsList: TRoomsList = [];
  io: Server;
  dbManager: DBManager;
  avatarsManager: AvatarsManager;
  onlineCounter: Dictionary<number> = {};

  get roomListCutted() {
    return this.roomsList.slice(0, 20);
  }

  createRoom(uuid: string, leaderID: string, players: string[], options?: GameOptions) {
    this.rooms[uuid] = new Room(uuid, leaderID, players, this.io, options);

    this.updateRoomsList(this.rooms[uuid]);

    // Delete room after 10 day timeout
    setTimeout(() => {
      this.destroyRoom(uuid);
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
        hostID: room.players.find((id) => id === room.leaderID),
        state: room.data.stage,
        options: room.options,
        startAt: room.startAt,
        createAt: room.createAt,
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

  generateRoomsListFromDB(rooms: StartedRoomState[]) {
    const roomsInfo = rooms.map<TRoomInfo>((room) => {
      return {
        hostID: room.leaderID,
        state: 'started',
        options: room.options,
        startAt: room.startAt,
        createAt: room.createAt,
        uuid: room.roomID,
        players: room.players.length,
        result: room.game.result,
      };
    });

    this.roomsList.unshift(...roomsInfo);
  }

  restartRoom(uuid: string) {
    const room = this.rooms[uuid];

    if (room == null) {
      throw new Error(`Cant find game for restart with uuid ${uuid}`);
    }

    if (room.data.stage === 'started') {
      if (room.nextRoomID) {
        throw new Error(`Cant restart game with uuid ${uuid}, game already restarted ${room.nextRoomID}`);
      }

      if (room.data.manager.game.stage === 'end') {
        const newUUID = crypto.randomUUID();
        room.nextRoomID = newUUID;
        this.createRoom(newUUID, room.leaderID, room.players, room.options);

        this.io.to(room.roomID).emit('restartGame', newUUID);
      } else {
        throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.manager.game.stage}`);
      }
    } else {
      throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.stage}`);
    }
  }

  destroyRoom(uuid: string) {
    this.updateRoomsList(uuid, true);
    this.io.to(uuid).emit('destroyRoom', uuid);
    delete this.rooms[uuid];
  }

  saveRoomToDB(room: Room) {
    const state = room.calculateRoomState();

    if (state.stage === 'started') {
      this.dbManager.saveRoomToDB(state);
    }
  }

  constructor(io: Server, dbManager: DBManager) {
    this.io = io;
    this.dbManager = dbManager;
    this.avatarsManager = new AvatarsManager(dbManager);

    this.dbManager.getLastRooms(20).then((rooms) => {
      this.generateRoomsListFromDB(rooms);
    });

    eventBus.on('roomUpdated', (room) => {
      this.updateRoomsList(room);
    });

    eventBus.on('gameEnded', (roomID) => {
      const room = this.rooms[roomID];

      if (room) {
        this.saveRoomToDB(room);
      }
    });

    eventBus.on('restartRoom', (room) => {
      this.restartRoom(room.roomID);
    });

    eventBus.on('destroyRoom', (room) => {
      this.destroyRoom(room.roomID);
    });

    io.on('connection', (socket) => {
      // Register rating endpoints
      registerRatingEndpoints(socket);
      handleSocketErrors(socket);
      this.updateOnlineCounter('lobby', 1);

      const { token } = socket.handshake.auth;

      const userState: {
        userID: string | undefined;
      } = {
        userID: undefined,
      };

      if (token) {
        try {
          const tokenValue = validateJWT(token);
          userState.userID = tokenValue.id;
        } catch (e) {
          socket.emit('renewJWT');
        }
      }

      if (userState.userID) {
        socket.join(userState.userID);
      }

      socket.on('joinRoom', async (uuid, cb) => {
        console.log(`user ${userState.userID} join room uuid: ${uuid}`);

        const room = this.rooms[uuid];
        const gameFromDB = await this.dbManager.getRoomFromDB(uuid);

        if (room || gameFromDB) {
          socket.join(uuid);
          this.updateOnlineCounter(uuid, 1);
        }

        if (gameFromDB) {
          cb(gameFromDB);
          return;
        }

        if (room) {
          cb(this.rooms[uuid].calculateRoomState(userState.userID));
        } else {
          cb({ error: 'errorNotFound' });
        }
      });

      socket.on('leaveRoom', (uuid) => {
        socket.leave(uuid);
        this.updateOnlineCounter(uuid, -1);
        console.log(`user ${userState.userID} leave room uuid: ${uuid}`);
      });

      socket.on('getRoomsList', (cb) => {
        socket.join('lobby');
        cb(this.roomListCutted);
      });

      socket.on('getOnlineCounter', (id, cb) => {
        cb(this.onlineCounter[id]);
      });

      socket.on('getTotalStats', async (cb) => {
        const stats = await dbManager.getFullStats();

        cb(stats);
      });

      socket.on('getPlayerGames', async (uuid, cb) => {
        const games = await dbManager.getPlayerGames(uuid);
        cb(games);
      });

      socket.on('registerUser', async (user, cb) => {
        const userForUI = await dbManager.registerUser(user);

        cb(userForUI);
      });

      socket.on('login', async (loginOrEmail, password, cb) => {
        const userForUI = await dbManager.login(loginOrEmail, password);

        cb(userForUI);
      });

      socket.on('getUserProfile', async (id, cb) => {
        const publicUser = await dbManager.getPublicUserProfile(id);

        cb(publicUser);
      });

      if (userState.userID) {
        this.createMethodsForAuthUsers(socket, userState.userID);
        this.createMethodsForGame(socket, userState.userID);
      }

      socket.on('disconnecting', () => {
        Array.from(socket.rooms).forEach((room) => {
          this.updateOnlineCounter(room, -1);
        });

        if (!socket.rooms.has('lobby')) {
          this.updateOnlineCounter('lobby', -1);
        }
      });
    });

    setInterval(() => {
      const currentTime = new Date();

      this.roomsList = this.roomsList.filter((el) => {
        const createAt = new Date(el.createAt);
        const minutes = 60 * 1000;

        if (!el.startAt) {
          return (Number(currentTime) - Number(createAt)) / minutes < 30;
        } else {
          const startAt = new Date(el.startAt);

          return (Number(currentTime) - Number(startAt)) / minutes < 600 || el.result?.winner;
        }
      });
    }, 60000 * 30);
  }

  createMethodsForAuthUsers(socket: ServerSocket, userID: string): void {
    socket.on('updateUserPassword', async (password, newPassword, cb) => {
      const result = await this.dbManager.updateUserCredentials(userID, password, 'password', newPassword);

      cb(result);
    });

    socket.on('getUserAvatars', async (cb) => {
      const avatars = await this.avatarsManager.getAvailableAvatarsForUser(userID);
      cb(avatars);
    });

    socket.on('getMyProfile', async (cb) => {
      const userForUI = await this.dbManager.getUserProfile(userID);

      cb(userForUI);
    });

    socket.on('revealEasterEgg', () => {
      this.dbManager.revealEasterEgg(userID);
    });

    socket.on('updateUserAvatar', async (avatarID, cb) => {
      const result = await this.avatarsManager.updateUserAvatar(userID, avatarID);
      cb(result);
    });

    socket.on('updateUserEmail', async (password, email, cb) => {
      const result = await this.dbManager.updateUserCredentials(userID, password, 'email', email);

      cb(result);
    });

    socket.on('updateUserLogin', async (password, login, cb) => {
      const result = await this.dbManager.updateUserCredentials(userID, password, 'login', login);

      cb(result);
    });

    socket.on('updateUserName', (name) => {
      this.dbManager.updateUserName(userID, name);
    });

    socket.on('createRoom', (cb) => {
      const uuid = crypto.randomUUID();
      console.log('createRoom', uuid);
      this.createRoom(uuid, userID, [userID]);
      cb(uuid);
    });

    socket.on('restartGame', (uuid) => {
      console.log(`restart room with uuid: ${uuid}`);
      this.restartRoom(uuid);
    });

    socket.on('sendMessage', (uuid, message) => {
      console.log(`sendMessage to ${uuid}`, message);
      const room = this.rooms[uuid];

      if (room) {
        room.addMessage(userID, message);
      }
    });

    socket.on('joinGame', (uuid) => {
      console.log('joinGame', uuid);
      const room = this.rooms[uuid];

      if (room) {
        room.joinGame(userID);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('leaveGame', (uuid) => {
      console.log('leaveGame', uuid);
      const room = this.rooms[uuid];

      if (room) {
        room.leaveGame(userID);

        if (this.rooms[uuid]) {
          eventBus.emit('roomUpdated', room);
        }
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

        if (this.rooms[uuid]) {
          eventBus.emit('roomUpdated', room);
        }
      }
    });
  }

  createMethodsForGame(socket: ServerSocket, userID: string): void {
    const getRoomManager = (uuid: string) => {
      const room = this.rooms[uuid];
      if (room.data.stage === 'started') {
        return room.data.manager;
      }

      throw new Error(`Room with uuid ${uuid} have wrong stage ${this.rooms[uuid].data.stage}`);
    };

    socket.on('selectPlayer', (uuid, selectedUserID) => {
      console.log(`Player ${selectedUserID} selected by ${userID} in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'selectPlayer', playerID: selectedUserID });
    });

    socket.on('sentSelectedPlayers', (uuid) => {
      console.log(`Player ${userID} send mission in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'sentSelectedPlayers' });
    });

    socket.on('voteForMission', (uuid, option) => {
      console.log(`Player ${userID} vote for mission (${option}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'voteForMission', option });
    });

    socket.on('actionOnMission', (uuid, result) => {
      console.log(`Player ${userID} action in mission (${result}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'actionOnMission', result });
    });

    socket.on('assassinate', (uuid, type, role) => {
      console.log(`Player ${userID} assassinate in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'assassinate', type, customRole: role });
    });

    socket.on('checkLoyalty', (uuid: string) => {
      console.log(`Player ${userID} checkLoyalty in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'checkLoyalty' });
    });

    socket.on('checkLoyaltyWithCard', (uuid: string, cardID: string) => {
      console.log(`Player ${userID} checkLoyalty with card ${cardID} in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'checkLoyalty', cardID });
    });

    socket.on('revealLoyalty', (uuid: string) => {
      console.log(`Player ${userID} revealLoyalty in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'revealLoyalty' });
    });

    socket.on('revealLoyaltyWithCard', (uuid: string, cardID: string) => {
      console.log(`Player ${userID} revealLoyalty with card ${cardID} in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'revealLoyalty', cardID });
    });

    socket.on('announceLoyalty', (uuid: string, loyalty: TLoyalty | TRoles) => {
      console.log(`Player ${userID} announceLoyalty in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'announceLoyalty', loyalty });
    });

    socket.on('announceLoyaltyWithCard', (uuid: string, loyalty: TLoyalty | TRoles, cardID: string) => {
      console.log(`Player ${userID} announceLoyalty with card ${cardID} in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'announceLoyalty', loyalty, cardID });
    });

    socket.on('getLoyalty', (uuid: string, cb: (loyalty: TLoyalty | TRoles) => void) => {
      console.log(`Player ${userID} getLoyalty in game ${uuid}`);
      cb(getRoomManager(uuid).getGameData(userID, { method: 'getLoyalty' }));
    });

    socket.on('getLoyaltyWithCard', (uuid: string, cardID: string, cb: (loyalty: TLoyalty | TRoles) => void) => {
      console.log(`Player ${userID} getLoyalty with card ${cardID} in game ${uuid}`);
      cb(getRoomManager(uuid).getGameData(userID, { method: 'getLoyalty', cardID }));
    });

    socket.on('giveExcalibur', (uuid) => {
      console.log(`Player ${userID} giveExcalibur in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'giveExcalibur' });
    });

    socket.on('useExcalibur', (uuid) => {
      console.log(`Player ${userID} useExcalibur in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useExcalibur' });
    });

    socket.on('useWitchAbility', (uuid, result) => {
      console.log(`Player ${userID} useWitchAbility in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'witchAbility', result });
    });

    socket.on('givePlotCard', (uuid) => {
      console.log(`Player ${userID} givePlotCard in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'givePlotCard' });
    });

    socket.on('preVote', (uuid: string, option: TVoteOption, cardID: string) => {
      console.log(`Player ${userID} preVote (${option}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'preVote', option, cardID });
    });

    socket.on('useLeadToVictory', (uuid: string, use: boolean, cardID: string) => {
      console.log(`Player ${userID} useLeadToVictory (used: ${use}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useLeadToVictory', use, cardID });
    });

    socket.on('useAmbush', (uuid: string, cardID: string) => {
      console.log(`Player ${userID} useAmbush in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useAmbush', cardID });
    });

    socket.on('useRestoreHonor', (uuid, restoreHonorCardID, cardID) => {
      console.log(`Player ${userID} useRestoreHonor (card: ${cardID}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useRestoreHonor', cardID, restoreHonorCardID });
    });

    socket.on('useKingReturns', (uuid: string, use: boolean, cardID: string) => {
      console.log(`Player ${userID} useKingReturns (used: ${use}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useKingReturns', use, cardID });
    });

    socket.on('useWeFoundYou', (uuid: string, use: boolean, cardID: string) => {
      console.log(`Player ${userID} useWeFoundYou (used: ${use}) in game ${uuid}`);
      getRoomManager(uuid).callGameMethods(userID, { method: 'useWeFoundYou', use, cardID });
    });
  }

  updateOnlineCounter(id: string, diff: -1 | 1): void {
    if (diff === -1 && !this.onlineCounter[id]) {
      return;
    }

    this.onlineCounter[id] = this.onlineCounter[id] || 0;
    this.onlineCounter[id] += diff;
    const emitName = id === 'lobby' ? 'onlineCounterUpdated' : 'roomOnlineUpdated';
    this.io.to(id).emit(emitName, this.onlineCounter[id]);
  }
}
