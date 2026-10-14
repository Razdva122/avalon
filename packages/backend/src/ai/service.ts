import { aiHumanRoles, aiPlayedModel, aiRosterInfo } from '@avalon/types';
import type {
  AiBotDifficulty,
  AiBotMode,
  AiLanguage,
  AiPlayerCount,
  CodexModelOption,
  CodexSettings,
  CodexWeeklyLimit,
  ServerSocket,
  TRoomInfo,
} from '@avalon/types';
import type { Manager } from '@/main';
import { randomUUID } from 'crypto';
import { AiRepository } from './repository';
import { BotRoom } from './room';
import { AiPause } from './client';
import { decisionPipeline } from './pipeline';
import { getCodexModels, validateCodexSettings } from './codex-models';
import { getCodexWeeklyLimit } from './codex-limits';
import { CODEX_MODEL, codexEnabled, codexDecide } from './codex';
import { getBotProfile } from './agents';
import { hasPremium } from '@/support/premium';
import { supportTotalCents } from '@/support/repository';
import { AI_PAUSE_TIMEOUT_MS } from './timing';
import { aiText } from './language';

const humanSettings: Record<AiBotMode, CodexSettings> = {
  smart: { model: 'gpt-6.1-sol', reasoning: 'medium' },
  regular: { model: 'gpt-6-luna', reasoning: 'medium' },
  beginner: { model: 'gpt-6-luna', reasoning: 'low' },
};

function humanModeAvailable(difficulty: AiBotMode, quota: CodexWeeklyLimit | null, models: CodexModelOption[]) {
  const weekly = quota?.remainingPercent;
  const short = quota?.shortTerm?.remainingPercent;
  const settings = humanSettings[difficulty];
  return (
    typeof weekly === 'number' &&
    Number.isFinite(weekly) &&
    weekly > (difficulty === 'smart' ? 5 : difficulty === 'regular' ? 3 : 1) &&
    (quota?.shortTerm === null ||
      (typeof short === 'number' &&
        Number.isFinite(short) &&
        short > (difficulty === 'smart' ? 60 : difficulty === 'regular' ? 30 : 20))) &&
    models.some((model) => model.id === settings.model && model.efforts.includes(settings.reasoning))
  );
}

function humanModeAvailableAt(difficulty: AiBotMode, quota: CodexWeeklyLimit | null, models: CodexModelOption[]) {
  const settings = humanSettings[difficulty];
  if (!models.some((model) => model.id === settings.model && model.efforts.includes(settings.reasoning))) return;
  const resets: number[] = [];
  for (const [window, threshold] of [
    [quota, difficulty === 'smart' ? 5 : difficulty === 'regular' ? 3 : 1],
    [quota?.shortTerm, difficulty === 'smart' ? 60 : difficulty === 'regular' ? 30 : 20],
  ] as const) {
    if (window === null && quota?.shortTerm === null) continue;
    if (!window || !Number.isFinite(window.remainingPercent)) return;
    if (window.remainingPercent <= threshold) {
      if (!window.resetsAt || !Number.isFinite(window.resetsAt) || window.resetsAt * 1000 <= Date.now()) return;
      resets.push(window.resetsAt * 1000);
    }
  }
  return resets.length ? Math.max(...resets) : undefined;
}

export class AiService {
  repository?: AiRepository;
  private archive?: AiRepository;
  get archiveRepository(): AiRepository | undefined {
    return this.repository || this.archive;
  }
  private creating = false;
  private starting = false;
  private publicStartingID?: string;
  private technicalStart?: { roomID: string };
  private running = new Set<string>();
  private launchTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pauseTimers = new Map<string, { expiresAt: number; timer: ReturnType<typeof setTimeout> }>();
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

  private async canPlay(userID?: string): Promise<boolean> {
    if (!this.repository || !userID || getBotProfile(userID) || !codexEnabled()) return false;
    try {
      return Boolean(await this.manager.dbManager.getUserByID(userID));
    } catch {
      return false;
    }
  }

  private async canPlayLargeTables(userID: string): Promise<boolean> {
    try {
      const features = await this.manager.dbManager.getUserFeatures(userID);
      return hasPremium(await supportTotalCents(userID), features);
    } catch {
      return false;
    }
  }

  private async humanModes() {
    return (await this.humanAvailability()).botModes;
  }

  private async humanAvailability() {
    const [quota, models] = await Promise.allSettled([getCodexWeeklyLimit(), getCodexModels()]);
    const limit = quota.status === 'fulfilled' ? quota.value : null;
    const catalog = models.status === 'fulfilled' ? models.value : [];
    const botModes = {
      smart: humanModeAvailable('smart', limit, catalog),
      regular: humanModeAvailable('regular', limit, catalog),
      beginner: humanModeAvailable('beginner', limit, catalog),
    };
    const botModeAvailableAt: Partial<Record<AiBotMode, number>> = {};
    for (const difficulty of ['smart', 'regular', 'beginner'] as const) {
      const availableAt = humanModeAvailableAt(difficulty, limit, catalog);
      if (!botModes[difficulty] && availableAt !== undefined) botModeAvailableAt[difficulty] = availableAt;
    }
    return { botModes, botModeAvailableAt };
  }

  private publicRoom(room: BotRoom) {
    return Boolean(room.ai?.publicBotGame || room.ai?.botDifficulty);
  }

  private clearLaunchTimer(id: string) {
    clearTimeout(this.launchTimers.get(id));
    this.launchTimers.delete(id);
  }

  private async expireLaunch(room: BotRoom) {
    if (this.manager.rooms[room.roomID] !== room || room.ai?.status !== 'ready') return;
    this.clearLaunchTimer(room.roomID);
    delete room.ai.launchExpiresAt;
    room.stop('Bot game preparation timed out after 90 seconds.');
    if (this.publicStartingID === room.roomID) {
      this.publicStartingID = undefined;
      this.starting = false;
    }
    try {
      await this.repository!.save(room.calculateRoomState());
    } finally {
      await this.repository!.release(room.roomID).catch(() => {});
      this.manager.updateRoomsList(room);
    }
  }

  private launchReady(room: BotRoom) {
    return (
      this.manager.rooms[room.roomID] === room &&
      room.ai?.status === 'ready' &&
      typeof room.ai.launchExpiresAt === 'number' &&
      room.ai.launchExpiresAt > Date.now()
    );
  }

  private clearPauseTimer(id: string) {
    clearTimeout(this.pauseTimers.get(id)?.timer);
    this.pauseTimers.delete(id);
  }

  private async expirePause(room: BotRoom, timer: ReturnType<typeof setTimeout>) {
    const id = room.roomID;
    if (this.pauseTimers.get(id)?.timer !== timer) return;
    this.clearPauseTimer(id);
    if (this.manager.rooms[id] !== room || room.ai?.status !== 'paused') return;
    if (this.technicalStart?.roomID === id) {
      this.technicalStart = undefined;
      this.starting = false;
    }
    try {
      room.stop(aiText(room.ai.language).pauseExpired);
      await this.repository!.save(room.calculateRoomState());
    } finally {
      await this.repository!.release(id).catch(() => {});
      this.manager.updateRoomsList(room);
    }
  }

  private schedulePauseExpiry(room: BotRoom) {
    this.clearPauseTimer(room.roomID);
    const expiresAt = Date.now() + AI_PAUSE_TIMEOUT_MS;
    const timer = setTimeout(() => {
      void this.expirePause(room, timer).catch(() => console.error('AI pause expiry could not be saved'));
    }, AI_PAUSE_TIMEOUT_MS);
    timer.unref();
    this.pauseTimers.set(room.roomID, { expiresAt, timer });
  }

  private createRoom(id: string, owner: string, language: AiLanguage, playerCount: AiPlayerCount) {
    const room: BotRoom = new BotRoom(
      id,
      owner,
      this.manager.io,
      decisionPipeline(codexDecide(id, this.repository!, undefined, () => room.ai?.codex)),
      async (state) => {
        await this.repository!.save(state);
        if (state.stage === 'started' && state.game.stage === 'end' && state.ai?.humanPlayerID) {
          await this.repository!.processPendingAchievements((saved) =>
            this.manager.achievementManager.achievementHandlers.handleAiGameEnd(saved),
          ).catch(() => console.error('AI achievement processing failed; will retry'));
        }
      },
      0,
      language,
      playerCount,
      10000,
    );
    room.ai!.model = CODEX_MODEL;
    room.renewLease = () => this.repository!.renewLease(id);
    if (this.manager.chatService) {
      room.persistChatMessage = (author, text, requestID) =>
        this.manager.chatService.sendText(id, author, text, requestID, () => this.manager.rooms[id] === room);
    }
    return room;
  }

  private runRoom(room: BotRoom, technical = false) {
    const id = room.roomID;
    this.clearPauseTimer(id);
    this.running.add(id);
    // run changes status synchronously before the first await: duplicate starts cannot spend twice.
    void room
      .run(technical)
      .catch(() => {
        /* room.run already exposes a sanitized paused status */
      })
      .finally(async () => {
        if (this.manager.rooms[id] === room && room.ai?.status === 'paused') this.schedulePauseExpiry(room);
        try {
          await this.repository!.release(id).catch(() => {});
        } finally {
          this.running.delete(id);
          this.manager.updateRoomsList(room);
        }
      });
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
            aiTitle: room.ai?.title,
            ...aiRosterInfo(room.ai, room.players.length),
            aiBeginner: room.ai?.beginner,
            aiBotDifficulty: room.ai?.botDifficulty,
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
          .filter((room) => room.aiStatus !== 'stopped')
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
        const canPlay = await this.canPlay(userID);
        const eligibleSlot = () => {
          const active = this.active();
          return (
            !active ||
            (active instanceof BotRoom &&
              this.publicRoom(active) &&
              Boolean(userID && active.isHuman(userID)) &&
              this.launchReady(active))
          );
        };
        const availability =
          canPlay && eligibleSlot() && !this.creating && !this.starting && !this.running.size
            ? await this.humanAvailability()
            : { botModes: { smart: false, regular: false, beginner: false }, botModeAvailableAt: {} };
        let { botModes } = availability;
        // A room may claim the shared slot while read-only quota/catalog lookups are in flight.
        const active = this.active();
        const botsBusy = !eligibleSlot() || this.creating || this.starting || this.running.size > 0;
        if (botsBusy) botModes = { smart: false, regular: false, beginner: false };
        const ownRoomID =
          active instanceof BotRoom && this.publicRoom(active) && Boolean(userID && active.isHuman(userID))
            ? active.roomID
            : undefined;
        const publicAccess = canPlay
          ? {
              canPlay,
              botModes,
              canPlayLargeTables: await this.canPlayLargeTables(userID!),
              ...(!botsBusy && Object.keys(availability.botModeAvailableAt).length
                ? { botModeAvailableAt: availability.botModeAvailableAt }
                : {}),
              ...(botsBusy ? { botsBusy: true } : {}),
              ...(ownRoomID ? { ownRoomID } : {}),
            }
          : {};
        cb(
          canManage
            ? {
                canManage,
                roomID: this.active()?.roomID,
                models: [{ id: CODEX_MODEL, label: 'Codex · ChatGPT' }],
                defaultModel: CODEX_MODEL,
                ...publicAccess,
              }
            : { canManage, ...publicAccess },
        );
      } catch {
        cb({ canManage: false });
      }
    });
    socket.on('createHumanAiRoom', async (...args: unknown[]) => {
      const cb = args[args.length - 1] as (result: { roomID: string } | { error: string }) => void;
      if (typeof cb !== 'function') return;
      const options =
        args.length === 1
          ? { beginner: false }
          : (args[0] as {
              beginner: boolean;
              role?: import('@avalon/types').AiHumanRole;
              withFriend?: boolean;
              humanSeats?: 2 | 3;
              difficulty?: AiBotDifficulty;
              language?: AiLanguage;
              playerCount?: AiPlayerCount;
            });
      if (
        !options ||
        typeof options !== 'object' ||
        Array.isArray(options) ||
        Object.keys(options).some(
          (key) =>
            !['beginner', 'role', 'withFriend', 'humanSeats', 'difficulty', 'language', 'playerCount'].includes(key),
        ) ||
        typeof options.beginner !== 'boolean' ||
        (options.role !== undefined &&
          (options.withFriend === true || !aiHumanRoles(options.playerCount ?? 5).includes(options.role))) ||
        (options.withFriend !== undefined && typeof options.withFriend !== 'boolean') ||
        (options.humanSeats !== undefined && (!options.withFriend || ![2, 3].includes(options.humanSeats))) ||
        (options.beginner && options.withFriend === true) ||
        (options.difficulty !== undefined && !['regular', 'smart'].includes(options.difficulty)) ||
        (options.language !== undefined && !['en', 'ru', 'zh-tw'].includes(options.language)) ||
        (options.playerCount !== undefined && ![5, 6, 7, 8].includes(options.playerCount)) ||
        (options.beginner &&
          ((options.difficulty !== undefined && options.difficulty !== 'regular') ||
            (options.playerCount !== undefined && options.playerCount !== 5)))
      )
        return cb({ error: 'Invalid bot room options' });
      let claimedID: string | undefined;
      let createdRoom: BotRoom | undefined;
      let locked = false;
      try {
        if (!(await this.canPlay(userID))) return cb({ error: 'AI room access denied' });
        if ((options.playerCount ?? 5) >= 7 && !(await this.canPlayLargeTables(userID!)))
          return cb({ error: 'Premium is required for seven or eight players' });
        const active = this.active();
        if (active)
          return cb(
            active instanceof BotRoom && this.publicRoom(active) && Boolean(userID && active.isHuman(userID))
              ? { roomID: active.roomID }
              : { error: 'Another AI match is already active' },
          );
        if (this.creating || this.starting || this.running.size) return cb({ error: 'AI room control in progress' });
        if (Object.keys(this.manager.rooms).length >= 500) return cb({ error: 'Room limit reached' });
        this.creating = locked = true;
        const modes = await this.humanModes();
        if (
          options.beginner
            ? !modes.beginner
            : options.difficulty
              ? !modes[options.difficulty]
              : !modes.smart && !modes.regular
        )
          return cb({ error: 'Bot games are currently unavailable' });
        const profile = await this.manager.dbManager.getUserByID(userID!);
        if (Object.keys(this.manager.rooms).length >= 500) return cb({ error: 'Room limit reached' });
        const id = randomUUID();
        await this.repository!.claim(id);
        claimedID = id;
        const room = (createdRoom = this.createRoom(id, userID!, options.language ?? 'en', options.playerCount ?? 5));
        room.ai!.publicBotGame = true;
        room.ai!.beginner = options.beginner;
        room.ai!.preparedDifficulty = options.difficulty;
        if (options.withFriend) {
          room.ai!.withFriend = true;
          room.ai!.humanSeats = options.humanSeats ?? 2;
        }
        room.ai!.title = `${typeof profile.name === 'string' && profile.name.trim() ? profile.name : userID} vs ${(options.playerCount ?? 5) - (options.withFriend ? (options.humanSeats ?? 2) : 1)} Bots`;
        const preparationMs = options.withFriend ? 120000 : 60000;
        room.ai!.launchExpiresAt = Date.now() + preparationMs;
        room.joinAsHuman(userID!);
        if (options.role !== undefined) room.setHumanRole(options.role);
        this.manager.rooms[id] = room;
        const timer = setTimeout(() => void this.expireLaunch(room).catch(() => {}), preparationMs);
        timer.unref();
        this.launchTimers.set(id, timer);
        this.manager.updateRoomsList(room);
        cb({ roomID: id });
      } catch (error) {
        if (createdRoom) {
          this.clearLaunchTimer(createdRoom.roomID);
          createdRoom.stop();
          delete this.manager.rooms[createdRoom.roomID];
        }
        if (claimedID && !this.running.has(claimedID)) await this.repository!.release(claimedID).catch(() => {});
        cb({ error: error instanceof AiPause ? error.message : 'Could not create AI room' });
      } finally {
        if (locked) this.creating = false;
      }
    });
    socket.on('startHumanAiRoom', async (id, options, cb) => {
      if (typeof cb !== 'function') return;
      let locked = false;
      let claimed = false;
      try {
        if (!(await this.canPlay(userID))) return cb({ error: 'AI room access denied' });
        if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom) || !this.publicRoom(room) || room.ai?.humanPlayerID !== userID)
          return cb({ error: 'AI room access denied' });
        if (
          !options ||
          typeof options !== 'object' ||
          Array.isArray(options) ||
          Object.keys(options).some((key) => !['difficulty', 'language', 'playerCount'].includes(key)) ||
          (options.playerCount !== undefined && ![5, 6, 7, 8].includes(options.playerCount)) ||
          !['smart', 'regular'].includes(options.difficulty) ||
          !['en', 'ru', 'zh-tw'].includes(options.language)
        )
          return cb({ error: 'Invalid bot mode or language' });
        if (room.ai!.withFriend && room.humanIDs.length !== (room.ai!.humanSeats ?? 2))
          return cb({ error: 'Wait for your friend to join before launch' });
        if (
          room.ai!.preparedDifficulty &&
          (options.difficulty !== room.ai!.preparedDifficulty ||
            options.language !== room.ai!.language ||
            (options.playerCount ?? 5) !== room.ai!.playerCount)
        )
          return cb({ error: 'The prepared bot settings cannot be changed at launch' });
        const playerCount = options.playerCount ?? 5;
        if (room.ai!.beginner && (options.difficulty !== 'regular' || playerCount !== 5))
          return cb({ error: 'Beginner games require regular bots and five players' });
        if (playerCount >= 7 && !(await this.canPlayLargeTables(userID!)))
          return cb({ error: 'Premium is required for seven or eight players' });
        if (!this.launchReady(room)) {
          await this.expireLaunch(room);
          return cb({ error: 'The bot game preparation time has expired' });
        }
        if (this.creating || this.starting || this.running.size || this.active() !== room)
          return cb({ error: 'AI room control in progress' });
        this.starting = locked = true;
        this.publicStartingID = id;
        const modes = await this.humanModes();
        if (!this.launchReady(room)) {
          await this.expireLaunch(room);
          return cb({ error: 'The bot game preparation time has expired' });
        }
        const mode = room.ai!.beginner ? 'beginner' : options.difficulty;
        if (!modes[mode]) return cb({ error: 'This bot mode is currently unavailable' });
        await this.repository!.claim(id);
        claimed = true;
        if (!this.launchReady(room)) {
          await this.expireLaunch(room);
          return cb({ error: 'The bot game preparation time has expired' });
        }
        const friendNames: string[] = [];
        if (room.ai!.withFriend) {
          const humanIDs = [...room.humanIDs];
          if (humanIDs.length !== (room.ai!.humanSeats ?? 2))
            return cb({ error: 'Wait for your friends to join before launch' });
          for (const friendID of humanIDs.slice(1)) {
            const friend = await this.manager.dbManager.getUserByID(friendID);
            friendNames.push(friend.name || friendID);
          }
          if (!this.launchReady(room)) {
            await this.expireLaunch(room);
            return cb({ error: 'The bot game preparation time has expired' });
          }
          if (humanIDs.some((id, index) => room.humanIDs[index] !== id) || room.humanIDs.length !== humanIDs.length)
            return cb({ error: 'Bot room preparation changed' });
        }
        room.setPlayerCount(playerCount);
        room.ai!.title = room.ai!.title?.replace(/vs \d+ Bots$/, `vs ${playerCount - room.humanIDs.length} Bots`);
        if (friendNames.length) room.ai!.title = room.ai!.title?.replace(' vs ', ` + ${friendNames.join(' + ')} vs `);
        room.setLanguage(options.language);
        room.ai!.botDifficulty = options.difficulty;
        room.ai!.codex = { ...humanSettings[mode] };
        delete room.ai!.launchExpiresAt;
        this.clearLaunchTimer(id);
        this.runRoom(room);
        this.manager.updateRoomsList(room);
        cb({ ok: true });
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not start AI room' });
      } finally {
        if (locked && this.publicStartingID === id) {
          this.publicStartingID = undefined;
          this.starting = false;
        }
        if (claimed && !this.running.has(id)) await this.repository!.release(id).catch(() => {});
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
          const room = this.createRoom(id, userID!, language, playerCount);
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
        if (!(room instanceof BotRoom) || !userID || !room.isHuman(userID))
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
        if (
          !(room instanceof BotRoom) ||
          this.publicRoom(room) ||
          room.ai?.model !== CODEX_MODEL ||
          room.ai.status !== 'ready' ||
          this.starting
        )
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
        if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) return cb({ error: 'Invalid room ID' });
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom)) return cb({ error: 'AI room not found' });
        const ownHumanRoom = Boolean(this.publicRoom(room) && userID && room.isHuman(userID));
        if (!(await this.canManage(userID)) && !(ownHumanRoom && (await this.canPlay(userID))))
          return cb({ error: 'AI room access denied' });
        if (this.starting) return cb({ error: 'AI room control in progress' });
        if (action === 'stop') {
          this.clearLaunchTimer(id);
          this.clearPauseTimer(id);
          delete room.ai!.launchExpiresAt;
          room.stop();
          await this.repository!.save(room.calculateRoomState());
          if (!this.running.has(id)) await this.repository!.release(id);
          this.manager.updateRoomsList(room);
          return cb({ ok: true });
        }
        const technical = action === 'resumeTechnical';
        if (!technical && this.publicRoom(room)) return cb({ error: 'Choose a bot mode and language before launch' });
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
        const technicalStart = technical ? { roomID: id } : undefined;
        if (technicalStart) this.technicalStart = technicalStart;
        try {
          if (!technical && room.ai?.botDifficulty && !(await this.humanModes())[room.ai.botDifficulty])
            return cb({ error: 'This bot mode is currently unavailable' });
          if (room.ai?.status !== (technical ? 'paused' : 'ready')) return cb({ error: 'AI room control in progress' });
          await this.repository!.claim(id);
          const pause = this.pauseTimers.get(id);
          if (technical && pause && pause.expiresAt <= Date.now()) await this.expirePause(room, pause.timer);
          if (
            this.manager.rooms[id] !== room ||
            room.ai?.status !== (technical ? 'paused' : 'ready') ||
            (technical && (this.technicalStart !== technicalStart || !room.ai.canResumeTechnical))
          ) {
            await this.repository!.release(id).catch(() => {});
            return cb({ error: 'AI room is no longer ready to start or resume' });
          }
          this.runRoom(room, technical);
          this.manager.updateRoomsList(room);
          cb({ ok: true });
        } finally {
          if (!technicalStart || this.technicalStart === technicalStart) {
            this.technicalStart = undefined;
            this.starting = false;
          }
        }
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'AI room control failed' });
      }
    });
  }
}
