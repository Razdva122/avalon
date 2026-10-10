import { aiPlayedModel } from '@avalon/types';
import type { AiLanguage, AiPlayerCount, ServerSocket, TRoomInfo } from '@avalon/types';
import type { Manager } from '@/main';
import { randomUUID } from 'crypto';
import { AiRepository } from './repository';
import { BotRoom } from './room';
import { AiPause } from './client';
import { decisionPipeline } from './pipeline';
import { getCodexModels, validateCodexSettings } from './codex-models';
import { getCodexWeeklyLimit } from './codex-limits';
import { CODEX_MODEL, codexEnabled, codexDecide } from './codex';

export class AiService {
  repository?: AiRepository;
  private archive?: AiRepository;
  get archiveRepository(): AiRepository | undefined {
    return this.repository || this.archive;
  }
  private creating = false;
  private starting = false;
  private running = new Set<string>();
  constructor(private manager: Manager) {
    const db = manager.dbManager.dbInstance?.connection.db;
    if (db) this.archive = new AiRepository(db);
    if (process.env.AI_ROOMS_ENABLED === 'true' && db && codexEnabled()) this.repository = new AiRepository(db);
  }
  private active() {
    return Object.values(this.manager.rooms).find((r) => r.ai && ['ready', 'running', 'paused'].includes(r.ai.status));
  }
  async canManage(userID?: string): Promise<boolean> {
    if (!this.repository || !userID || !codexEnabled()) return false;
    try {
      const profile = await this.manager.dbManager.getUserByID(userID);
      return profile.isAdmin === true;
    } catch {
      return false;
    }
  }

  register(socket: ServerSocket, userID?: string) {
    socket.on('getAiRoomsList', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        const archived = (await this.archiveRepository?.recentSummaries()) || [];
        const live = Object.values(this.manager.rooms)
          .filter((room) => room.ai)
          .map((room) => room.calculateRoomState())
          .map<TRoomInfo>((room) => ({
            uuid: room.roomID,
            ai: true,
            aiStatus: room.ai?.status,
            aiModel: aiPlayedModel(room.ai),
            aiLanguage: room.ai?.language ?? 'en',
            hostID: room.leaderID,
            state: room.stage,
            options: room.options,
            players: room.players.length,
            createAt: room.createAt,
            startAt: room.stage === 'started' ? room.startAt : undefined,
            result: room.stage === 'started' ? room.game.result : undefined,
          }));
        const rooms = [...new Map([...archived, ...live].map((room) => [room.uuid, room])).values()]
          .sort((a, b) => Date.parse(b.createAt) - Date.parse(a.createAt))
          .slice(0, 20);
        cb({ rooms });
      } catch {
        cb({ error: 'Could not load AI rooms' });
      }
    });
    socket.on('getAiSpectatorRoles', (id, cb) => {
      if (typeof cb !== 'function') return;
      if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
      const room = this.manager.rooms[id];
      // Spectating is public, but hidden roles must never be available in human games or to participants.
      if (
        !(room instanceof BotRoom) ||
        !room.ai ||
        room.ai.humanPlayerID !== undefined ||
        room.data.stage !== 'started' ||
        (userID !== undefined && room.players.includes(userID))
      )
        return cb({ error: 'AI spectator roles unavailable' });
      cb({
        roles: Object.fromEntries(room.data.manager.game.players.map((p) => [p.userID, p.role.role])),
        decisions: room.spectatorDecisions,
      });
    });
    socket.on('getAiCodexWeeklyLimit', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!codexEnabled() || !(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        cb({ weekly: await getCodexWeeklyLimit() });
      } catch {
        cb({ error: 'Could not load Codex limits' });
      }
    });
    socket.on('getAiCodexModels', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!codexEnabled() || !(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        cb({ models: await getCodexModels() });
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not load Codex models' });
      }
    });
    socket.on('getAiRoomAccess', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        const canManage = await this.canManage(userID);
        cb(
          canManage
            ? {
                canManage,
                roomID: this.active()?.roomID,
                models: [{ id: CODEX_MODEL, label: 'Codex · ChatGPT' }],
                defaultModel: CODEX_MODEL,
              }
            : { canManage },
        );
      } catch {
        cb({ canManage: false });
      }
    });
    socket.on('createAiRoom', async (options, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        let selectedModel: string;
        let language: AiLanguage = 'en';
        let playerCount: AiPlayerCount = 7;
        if (typeof options === 'string') selectedModel = options;
        else {
          if (!options || typeof options !== 'object' || Array.isArray(options) || typeof options.model !== 'string')
            return cb({ error: 'Invalid AI model' });
          if (!['en', 'ru', 'zh-tw'].includes(options.language)) return cb({ error: 'Invalid AI language' });
          if (Object.prototype.hasOwnProperty.call(options, 'playerCount')) {
            if (typeof options.playerCount !== 'number' || ![5, 6, 7, 8].includes(options.playerCount))
              return cb({ error: 'Invalid AI player count' });
            playerCount = options.playerCount;
          }
          selectedModel = options.model;
          language = options.language;
        }
        if (selectedModel !== CODEX_MODEL) return cb({ error: 'Only Codex is supported' });
        if (this.active()) return cb({ roomID: this.active()!.roomID });
        if (this.creating || this.starting || this.running.size) return cb({ error: 'AI room is being created' });
        this.creating = true;
        try {
          const id = randomUUID();
          await this.repository!.claim(id);
          const room: BotRoom = new BotRoom(
            id,
            userID!,
            this.manager.io,
            decisionPipeline(codexDecide(id, this.repository!, undefined, () => room.ai?.codex)),
            (state) => this.repository!.save(state),
            process.env.NODE_ENV === 'development' ? 2000 : 10000,
            language,
            playerCount,
          );
          room.ai!.model = CODEX_MODEL;
          room.renewLease = () => this.repository!.renewLease(id);
          if (this.manager.chatService) {
            room.persistChatMessage = (author, text, requestID) =>
              this.manager.chatService.sendText(id, author, text, requestID, () => this.manager.rooms[id] === room);
          }
          this.manager.rooms[id] = room;
          this.manager.updateRoomsList(room);
          cb({ roomID: id });
        } finally {
          this.creating = false;
        }
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not create AI room' });
      }
    });
    socket.on('finishAiDiscussion', async (id, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom) || !userID || room.ai?.humanPlayerID !== userID)
          return cb({ error: 'Not your discussion turn' });
        // Drain preceding chat writes before waking the next bot.
        await this.manager.chatService?.history(id, room.chat.history);
        if (this.manager.rooms[id] !== room) return cb({ error: 'Room changed' });
        room.finishDiscussion(userID);
        cb({ ok: true });
      } catch {
        cb({ error: 'Could not finish discussion turn' });
      }
    });
    socket.on('joinAiRoom', async (id, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom) || room.leaderID !== userID) return cb({ error: 'AI room access denied' });
        if (this.starting || this.running.has(id)) return cb({ error: 'AI room control in progress' });
        room.joinAsHuman(userID!);
        room.updateRoomState(true);
        this.manager.updateRoomsList(room);
        cb({ ok: true });
      } catch {
        cb({ error: 'Only the administrator owner can join before launch' });
      }
    });
    socket.on('configureAiCodex', async (id, settings, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (typeof id !== 'string' || !codexEnabled()) return cb({ error: 'Invalid Codex room' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom) || room.ai?.model !== CODEX_MODEL || room.ai.status !== 'ready' || this.starting)
          return cb({ error: 'Codex settings can only be changed before launch' });
        const validated = validateCodexSettings(settings, await getCodexModels());
        // Catalog lookup is asynchronous: recheck before changing a possibly started room.
        if (room.ai.status !== 'ready' || this.starting) return cb({ error: 'AI room control in progress' });
        this.starting = true;
        const previous = room.ai.codex;
        room.ai.codex = validated;
        try {
          await this.repository!.save(room.calculateRoomState());
        } catch (error) {
          room.ai.codex = previous;
          throw error;
        } finally {
          this.starting = false;
        }
        room.updateRoomState(true);
        this.manager.updateRoomsList(room);
        cb({ ok: true });
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not save Codex settings' });
      }
    });
    socket.on('controlAiRoom', async (id, action, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom)) return cb({ error: 'AI room not found' });
        if (this.starting) return cb({ error: 'AI room control in progress' });
        if (action === 'stop') {
          room.stop();
          await this.repository!.save(room.calculateRoomState());
          if (!this.running.has(id)) await this.repository!.release(id);
          this.manager.updateRoomsList(room);
          return cb({ ok: true });
        }
        const technical = action === 'resumeTechnical';
        if (
          this.running.size ||
          this.creating ||
          (technical
            ? room.ai?.status !== 'paused' || !room.ai.canResumeTechnical
            : action !== 'start' || room.ai?.status !== 'ready')
        )
          return cb({ error: 'AI room is not ready to start or resume' });
        if (room.ai?.model === CODEX_MODEL && !room.ai.codex)
          return cb({ error: 'Choose a Codex model and reasoning level before launch' });
        this.starting = true;
        try {
          await this.repository!.claim(id);
          this.running.add(id);
          // run changes status synchronously before the first await: duplicate starts cannot spend twice.
          void room
            .run(technical)
            .catch(() => {
              /* room.run already exposes a sanitized paused status */
            })
            .finally(async () => {
              this.manager.updateRoomsList(room);
              await this.repository!.release(id).catch(() => {});
              this.running.delete(id);
            });
          this.manager.updateRoomsList(room);
          cb({ ok: true });
        } finally {
          this.starting = false;
        }
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'AI room control failed' });
      }
    });
  }
}
