import { roomChannel, userChannel } from '@/helpers/channels';
import { validID } from '@/security/validation';
import { installSocketAdmission } from '@/security/socket-admission';
import { createRoomVoice, registerVoiceEndpoints } from '@/voice/runtime';
import type { VoiceService } from '@/voice/service';
import { publicRoomState } from '@/ai/public-state';
import { AiService } from '@/ai/service';
import { BOT_PROFILES } from '@/ai/room';
import { registerChatEndpoints } from '@/room/chat-endpoints';
import { ChatService } from '@/room/chat-service';
import { ChatRepository } from '@/room/chat-repository';
import { registerStickerEndpoints } from '@/stickers/endpoints';
import { StickersManager } from '@/stickers';
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
import { registerTrueSkillRatingEndpoints } from '@/scripts/trueSkillRatingEndpoints';
import { registerAchievementEndpoints } from '@/scripts/achievementEndpoints';
import { GameResultWorker } from '@/scripts/game-results';
import { DBManager } from '@/db';
import { installSessionChecks, revokeUserSockets } from '@/user/sessions';
import { AchievementManager } from '@/achievements';
import { AvatarsManager } from '@/user/avatars';

export class Manager {
  voice: VoiceService;
  aiService: AiService;
  stickersManager = new StickersManager();
  chatService: ChatService;
  rooms: Dictionary<Room> = Object.create(null);
  roomsList: TRoomsList = [];
  private roomTimers = new Map<string, NodeJS.Timeout>();
  io: Server;
  dbManager: DBManager;
  avatarsManager: AvatarsManager;
  achievementManager: AchievementManager;
  onlineCounter: Dictionary<number> = Object.create(null);

  get roomListCutted() {
    return this.roomsList.slice(0, 20);
  }

  createRoom(uuid: string, leaderID: string, players: string[], options?: GameOptions) {
    const retained = Object.values(this.rooms);
    if (
      retained.length >= 500 ||
      retained.filter(
        (room) =>
          room.leaderID === leaderID &&
          !room.nextRoomID &&
          (room.data.stage !== 'started' || room.data.manager.game.stage !== 'end'),
      ).length >= 3
    )
      throw Error('roomLimit');
    this.rooms[uuid] = new Room(uuid, leaderID, players, this.io, options);

    this.updateRoomsList(this.rooms[uuid]);

    const expire = () => {
      const room = this.rooms[uuid];
      if (!room) return;
      if (room.data.stage === 'started' && room.data.manager.game.stage !== 'end') {
        const timer = setTimeout(expire, 5 * 60000);
        timer.unref();
        this.roomTimers.set(uuid, timer);
      } else {
        this.destroyRoom(uuid);
      }
    };
    const timer = setTimeout(expire, 30 * 60000);
    timer.unref();
    this.roomTimers.set(uuid, timer);
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
        ai: Boolean(room.ai),
        aiStatus: room.ai?.status,
        aiModel: room.ai?.model,
        hostID: room.leaderID,
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
        ai: Boolean(room.ai),
        aiStatus: room.ai?.status,
        aiModel: room.ai?.model,
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

    // Existing live entries take precedence if a room was created during startup loading.
    this.roomsList = [...new Map([...roomsInfo, ...this.roomsList].map((room) => [room.uuid, room])).values()]
      .sort((a, b) => Date.parse(b.createAt) - Date.parse(a.createAt))
      .slice(0, 50);
    this.io.to('lobby').emit('roomsListUpdated', this.roomListCutted);
  }

  restartRoom(uuid: string) {
    const room = this.rooms[uuid];

    if (room == null) {
      throw new Error(`Cant find game for restart with uuid ${uuid}`);
    }

    if (room.ai) throw new Error('Create a new AI room with AI controls');

    if (room.data.stage === 'started') {
      if (room.nextRoomID) {
        throw new Error(`Cant restart game with uuid ${uuid}, game already restarted ${room.nextRoomID}`);
      }

      if (room.data.manager.game.stage === 'end') {
        const newUUID = crypto.randomUUID();
        this.createRoom(newUUID, room.leaderID, room.players, room.options);
        room.nextRoomID = newUUID;
        this.voice.destroyRoom(uuid);

        this.io.to(roomChannel(room.roomID)).emit('restartGame', newUUID);
      } else {
        throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.manager.game.stage}`);
      }
    } else {
      throw new Error(`Cant restart game with uuid ${uuid}, room stage ${room.data.stage}`);
    }
  }

  destroyRoom(uuid: string) {
    if (this.rooms[uuid]?.ai) return;
    clearTimeout(this.roomTimers.get(uuid));
    this.roomTimers.delete(uuid);
    const room = this.rooms[uuid];
    if (room?.data.stage === 'started') {
      room.data.manager.game.stateObserver.gameStateChanged = () => {};
      room.data.manager.game.timer.cleanup();
    }
    this.voice.destroyRoom(uuid);
    this.updateRoomsList(uuid, true);
    this.io.to(roomChannel(uuid)).emit('destroyRoom', uuid);
    delete this.rooms[uuid];
  }

  async saveRoomToDB(room: Room) {
    const state = room.calculateRoomState();

    if (state.stage === 'started') {
      await this.dbManager.saveRoomToDB(state);
    }
  }

  constructor(io: Server, dbManager: DBManager) {
    this.io = io;
    this.dbManager = dbManager;
    this.voice = createRoomVoice(this);
    this.aiService = new AiService(this);
    const chatDB = dbManager.dbInstance?.connection.db;
    this.chatService = new ChatService(
      chatDB ? new ChatRepository(chatDB) : undefined,
      (id) => this.rooms[id],
      async (id) => (await this.dbManager.getRoomFromDB(id)) || (await this.aiService.repository?.load(id)),
      io,
    );
    this.avatarsManager = new AvatarsManager(dbManager);
    this.achievementManager = new AchievementManager(io);

    void Promise.allSettled([
      this.dbManager.getLastRooms(20),
      this.aiService.repository?.recent(20) || Promise.resolve([]),
    ]).then((results) => {
      this.generateRoomsListFromDB(results.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])));
      if (results.some((result) => result.status === 'rejected'))
        console.error('Could not load part of the saved rooms list');
    });

    eventBus.on('roomUpdated', (room) => {
      this.updateRoomsList(room);
      const roomID = typeof room === 'string' ? room : room.roomID;
      this.io.to(roomChannel(roomID)).emit('voiceStateChanged', roomID);
      void this.voice.reconcile(roomID);
    });

    if (dbManager.dbInstance) {
      const results = new GameResultWorker(dbManager, async (game, sequence) => {
        await this.achievementManager.achievementHandlers.handleGameEnd(game, sequence);
        this.stickersManager.invalidateGameCounts(game.players.map((player) => player.id));
        game.players.forEach((player) => this.io.to(userChannel(player.id)).emit('stickersUpdated'));
      });
      const retry = () => {
        void results.flush().catch(() => console.error('Game result processing failed; will retry'));
      };
      const timer = setInterval(retry, 5000);
      timer.unref();
      retry();
      eventBus.on('gameEnded', (roomID) => {
        const room = this.rooms[roomID];
        if (!room || room.ai) return;
        const state = room.calculateRoomState();
        if (state.stage === 'started')
          void results.submit(state).catch(() => console.error('Game result save failed; will retry'));
      });
    }

    eventBus.on('gameEnded', (roomID) => {
      const room = this.rooms[roomID];
      if (!room || room.ai) return;
      // Give players a full conversation window after the game, regardless of its duration.
      clearTimeout(this.roomTimers.get(roomID));
      const timer = setTimeout(() => this.destroyRoom(roomID), 30 * 60000);
      timer.unref();
      this.roomTimers.set(roomID, timer);
    });

    eventBus.on('restartRoom', (room) => {
      this.restartRoom(room.roomID);
    });

    eventBus.on('destroyRoom', (room) => {
      this.destroyRoom(room.roomID);
    });

    installSocketAdmission(io);
    installSessionChecks(io);
    io.on('connection', (socket) => {
      // Register endpoints
      handleSocketErrors(socket);
      registerRatingEndpoints(socket);
      registerAchievementEndpoints(socket);
      this.updateOnlineCounter('lobby', 1);

      const userState: {
        userID: string | undefined;
      } = {
        userID: undefined,
      };

      if (socket.data.authUser) {
        const tokenValue = socket.data.authUser;
        userState.userID = tokenValue.id;
        this.dbManager
          .getUserCompletedAchievements(tokenValue.id, 'hidden')
          .then((achievements) => {
            socket.emit('hiddenAchievementsList', achievements);
          })
          .catch(() => socket.emit('serverError', 'requestFailed'));
      }

      registerTrueSkillRatingEndpoints(socket, userState.userID);

      if (userState.userID) {
        socket.join(userChannel(userState.userID));
      }

      this.aiService.register(socket, userState.userID);
      registerVoiceEndpoints(this.voice, socket, userState.userID);

      socket.on('joinRoom', async (uuid, cb) => {
        if (!validID(uuid)) throw Error('invalidRequest');
        const room = this.rooms[uuid];
        const gameFromDB = room
          ? null
          : (await this.dbManager.getRoomFromDB(uuid)) || (await this.aiService.repository?.load(uuid));

        if (room || gameFromDB) {
          if (!socket.rooms.has(roomChannel(uuid))) {
            if ([...socket.rooms].filter((id) => id.startsWith('room:')).length >= 20) throw Error('roomLimit');
            await socket.join(roomChannel(uuid));
            this.updateOnlineCounter(uuid, 1);
          }
        }

        if (gameFromDB) {
          const chat = await this.chatService.history(uuid, gameFromDB.chat);
          cb(publicRoomState({ ...gameFromDB, chat, archived: true }));
          return;
        }

        if (room) {
          await this.chatService.history(uuid, room.chat.history);
          const current = this.rooms[uuid];
          if (current) cb(publicRoomState(current.calculateRoomState(userState.userID)));
          else {
            // A post-game room may expire while its durable history is loading.
            const archived = await this.dbManager.getRoomFromDB(uuid);
            if (archived) {
              const chat = await this.chatService.history(uuid, archived.chat);
              cb(publicRoomState({ ...archived, chat, archived: true }));
            } else cb({ error: 'errorNotFound' });
          }
        } else {
          cb({ error: 'errorNotFound' });
        }
      });

      socket.on('leaveRoom', (uuid) => {
        this.voice.revokeSocket(socket.id, uuid);
        if (socket.rooms.has(roomChannel(uuid))) {
          socket.leave(roomChannel(uuid));
          this.updateOnlineCounter(uuid, -1);
        }
      });

      socket.on('getRoomsList', (cb) => {
        socket.join('lobby');
        cb(this.roomListCutted);
      });

      socket.on('getOnlineCounter', (id, cb) => {
        cb(this.onlineCounter[id] || 0);
      });

      socket.on('getTotalStats', async (cb) => {
        const stats = await dbManager.getFullStats();

        cb(stats);
      });

      socket.on('getPlayerGameSummariesPage', async (uuid, cursor, cb) => {
        cb(await dbManager.getPlayerGameSummariesPage(uuid, cursor));
      });

      socket.on('getPlayerGameSummaries', async (uuid, cb) => {
        try {
          cb(await dbManager.getPlayerGameSummaries(uuid));
        } catch (error) {
          console.error('Failed to load player game summaries', error);
          cb(null);
        }
      });

      socket.on('getPlayerGames', async (uuid, cb) => {
        const games = await dbManager.getPlayerGames(uuid);
        cb(games);
      });

      socket.on('registerUser', async (user, cb) => {
        const userForUI = await dbManager.registerUser({ ...user, id: crypto.randomUUID() });

        cb(userForUI);
      });

      socket.on('login', async (loginOrEmail, password, cb) => {
        const userForUI = await dbManager.login(loginOrEmail, password);

        cb(userForUI);
      });

      socket.on('getUserProfile', async (id, cb) => {
        const publicUser = BOT_PROFILES.find((p) => p.id === id) || (await dbManager.getPublicUserProfile(id));

        cb(publicUser);
      });

      if (userState.userID) {
        this.createMethodsForAuthUsers(socket, userState.userID);
        this.createMethodsForGame(socket, userState.userID);
      }

      socket.on('disconnecting', () => {
        Array.from(socket.rooms).forEach((room) => {
          if (room.startsWith('room:')) this.updateOnlineCounter(room.slice(5), -1);
        });

        this.updateOnlineCounter('lobby', -1);
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
      if (result === true) revokeUserSockets(this.io, userID);
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
      eventBus.emit('playerRevealSecret', userID);
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

    socket.on('updateUserName', async (name, cb) => {
      await this.dbManager.updateUserName(userID, name);
      cb?.(true);
    });

    socket.on('createRoom', (cb) => {
      const uuid = crypto.randomUUID();
      this.createRoom(uuid, userID, [userID]);
      cb(uuid);
    });

    socket.on('restartGame', (uuid) => {
      if (this.rooms[uuid]?.leaderID !== userID) throw Error('forbidden');
      this.restartRoom(uuid);
    });

    registerStickerEndpoints(socket, userID, this.stickersManager, this.chatService);

    registerChatEndpoints(socket, userID, this.chatService);

    socket.on('joinGame', (uuid) => {
      const room = this.rooms[uuid];

      if (room) {
        room.joinGame(userID);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('leaveGame', (uuid) => {
      const room = this.rooms[uuid];

      if (room) {
        room.leaveGame(userID);

        if (this.rooms[uuid]) {
          eventBus.emit('roomUpdated', room);
        }
      }
    });

    socket.on('lockRoom', (uuid) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.toggleLockedState();
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('updateOptions', (uuid, options) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.updateOptions(options);
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('endGame', (uuid) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.startVoteFor('endGame');
      }
    });

    socket.on('endAndRestartGame', (uuid) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.startVoteFor('endAndRestartGame');
      }
    });

    socket.on('shuffle', (uuid) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.shuffle();
      }
    });

    socket.on('voteInRoom', (uuid, result) => {
      const room = this.rooms[uuid];
      if (room) {
        room.makeVote(userID, result);
      }
    });

    socket.on('startGame', (uuid) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.startGame();
        eventBus.emit('roomUpdated', room);
      }
    });

    socket.on('kickPlayer', (uuid, kickUserID) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID) {
        room.leaveGame(kickUserID);

        if (this.rooms[uuid]) {
          eventBus.emit('roomUpdated', room);
        }
      }
    });

    // Custom timer events
    socket.on('startCustomTimer', (uuid: string, durationSeconds: number) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID && room.data.stage === 'started') {
        room.data.manager.callGameMethods(userID, { method: 'startCustomTimer', durationSeconds });
      }
    });

    socket.on('addCustomTimerTime', (uuid: string, additionalSeconds: number) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID && room.data.stage === 'started') {
        room.data.manager.callGameMethods(userID, { method: 'addCustomTimerTime', additionalSeconds });
      }
    });

    socket.on('stopCustomTimer', (uuid: string) => {
      const room = this.rooms[uuid];
      if (room && !room.ai && room.leaderID === userID && room.data.stage === 'started') {
        room.data.manager.callGameMethods(userID, { method: 'stopCustomTimer' });
      }
    });
  }

  createMethodsForGame(socket: ServerSocket, userID: string): void {
    const getRoomManager = (uuid: string) => {
      const room = this.rooms[uuid];
      if (room?.ai) throw new Error('AI players are controlled by the server');
      if (room?.data.stage === 'started' && room.players.includes(userID)) {
        return room.data.manager;
      }

      throw new Error(`Room with uuid ${uuid} have wrong stage ${this.rooms[uuid]?.data.stage}`);
    };

    socket.on('selectPlayer', (uuid, selectedUserID) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'selectPlayer', playerID: selectedUserID });
    });

    socket.on('sentSelectedPlayers', (uuid) => {
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
      getRoomManager(uuid).callGameMethods(userID, { method: 'assassinate', type, customRole: role });
    });

    socket.on('checkLoyalty', (uuid: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'checkLoyalty' });
    });

    socket.on('checkLoyaltyWithCard', (uuid: string, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'checkLoyalty', cardID });
    });

    socket.on('revealLoyalty', (uuid: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'revealLoyalty' });
    });

    socket.on('revealLoyaltyWithCard', (uuid: string, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'revealLoyalty', cardID });
    });

    socket.on('announceLoyalty', (uuid: string, loyalty: TLoyalty | TRoles) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'announceLoyalty', loyalty });
    });

    socket.on('announceLoyaltyWithCard', (uuid: string, loyalty: TLoyalty | TRoles, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'announceLoyalty', loyalty, cardID });
    });

    socket.on('getLoyalty', (uuid: string, cb: (loyalty: TLoyalty | TRoles) => void) => {
      cb(getRoomManager(uuid).getGameData(userID, { method: 'getLoyalty' }));
    });

    socket.on('getLoyaltyWithCard', (uuid: string, cardID: string, cb: (loyalty: TLoyalty | TRoles) => void) => {
      cb(getRoomManager(uuid).getGameData(userID, { method: 'getLoyalty', cardID }));
    });

    socket.on('giveExcalibur', (uuid) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'giveExcalibur' });
    });

    socket.on('useExcalibur', (uuid) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useExcalibur' });
    });

    socket.on('useWitchAbility', (uuid, result) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'witchAbility', result });
    });

    socket.on('givePlotCard', (uuid) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'givePlotCard' });
    });

    socket.on('preVote', (uuid: string, option: TVoteOption, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'preVote', option, cardID });
    });

    socket.on('useLeadToVictory', (uuid: string, use: boolean, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useLeadToVictory', use, cardID });
    });

    socket.on('useAmbush', (uuid: string, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useAmbush', cardID });
    });

    socket.on('useRestoreHonor', (uuid, restoreHonorCardID, cardID) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useRestoreHonor', cardID, restoreHonorCardID });
    });

    socket.on('useKingReturns', (uuid: string, use: boolean, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useKingReturns', use, cardID });
    });

    socket.on('useWeFoundYou', (uuid: string, use: boolean, cardID: string) => {
      getRoomManager(uuid).callGameMethods(userID, { method: 'useWeFoundYou', use, cardID });
    });
  }

  updateOnlineCounter(id: string, diff: -1 | 1): void {
    if (diff === -1 && !this.onlineCounter[id]) {
      return;
    }

    this.onlineCounter[id] = this.onlineCounter[id] || 0;
    this.onlineCounter[id] += diff;
    if (this.onlineCounter[id] === 0) delete this.onlineCounter[id];
    const emitName = id === 'lobby' ? 'onlineCounterUpdated' : 'roomOnlineUpdated';
    this.io.to(id === 'lobby' ? 'lobby' : roomChannel(id)).emit(emitName, this.onlineCounter[id] || 0);
  }
}
