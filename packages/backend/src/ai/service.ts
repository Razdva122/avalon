import { configuredCodexInstances, withCodexInstance, type CodexInstance } from './codex-instances';
import { BeginnerAnalysis, buildBeginnerAnalysis, beginnerAnalysisSettings } from './beginner-analysis';
import { aiHumanRoles, aiPlayedModel, aiRosterInfo, lobbyAiSizes } from '@avalon/types';
import type {
  AiBotDifficulty,
  AiBotInstanceStatus,
  BotQuotaThresholds,
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
import { validPacket } from '@/security/validation';
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
import { defaultBotQuotaThresholds, validBotQuotaThresholds } from './quota-policy';

const humanSettings: Record<AiBotMode, CodexSettings> = {
  smart: { model: 'gpt-6.1-sol', reasoning: 'medium' },
  regular: { model: 'gpt-6-luna', reasoning: 'medium' },
  beginner: { model: 'gpt-6-luna', reasoning: 'low' },
};

function humanModeAvailable(
  difficulty: AiBotMode,
  quota: CodexWeeklyLimit | null,
  models: CodexModelOption[],
  thresholds: BotQuotaThresholds,
) {
  const weekly = quota?.remainingPercent;
  const short = quota?.shortTerm?.remainingPercent;
  const settings = humanSettings[difficulty];
  return (
    typeof weekly === 'number' &&
    Number.isFinite(weekly) &&
    weekly > thresholds[difficulty].weekly &&
    (quota?.shortTerm === null ||
      (typeof short === 'number' && Number.isFinite(short) && short > thresholds[difficulty].shortTerm)) &&
    models.some((model) => model.id === settings.model && model.efforts.includes(settings.reasoning))
  );
}

function humanModeAvailableAt(
  difficulty: AiBotMode,
  quota: CodexWeeklyLimit | null,
  models: CodexModelOption[],
  thresholds: BotQuotaThresholds,
) {
  if (thresholds[difficulty].weekly === 100 || (quota?.shortTerm !== null && thresholds[difficulty].shortTerm === 100))
    return;
  const settings = humanSettings[difficulty];
  if (!models.some((model) => model.id === settings.model && model.efforts.includes(settings.reasoning))) return;
  const resets: number[] = [];
  for (const [window, threshold] of [
    [quota, thresholds[difficulty].weekly],
    [quota?.shortTerm, thresholds[difficulty].shortTerm],
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
  private beginnerAnalysis?: BeginnerAnalysis;
  get archiveRepository(): AiRepository | undefined {
    return this.repository || this.archive;
  }
  private lobbyRooms = new WeakSet<BotRoom>();
  private creating = new Set<string>();
  private starting = new Set<string>();
  private allocating = new Set<string>();
  private roomInstances = new Map<string, CodexInstance>();
  private technicalStarts = new Map<string, object>();
  private running = new Set<string>();
  private draftLeaseTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private launchTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pauseTimers = new Map<string, { expiresAt: number; timer: ReturnType<typeof setTimeout> }>();
  constructor(private manager: Manager) {
    const db = manager.dbManager.dbInstance?.connection.db;
    if (db) this.archive = new AiRepository(db);
    if (process.env.AI_ROOMS_ENABLED === 'true' && db && codexEnabled()) this.repository = new AiRepository(db);
    if (db && this.repository) this.beginnerAnalysis = new BeginnerAnalysis(db, this.repository);
  }
  private active(userID?: string) {
    return Object.values(this.manager.rooms).find(
      (r) =>
        r.ai &&
        ['ready', 'running', 'paused'].includes(r.ai.status) &&
        (!userID || r.leaderID === userID || (r instanceof BotRoom && r.isHuman(userID))),
    );
  }
  private instanceFor(roomID: string) {
    const instance = this.roomInstances.get(roomID);
    if (instance) return instance;
    const legacy = configuredCodexInstances().find((entry) => entry.id === 'default');
    if (!legacy) throw new AiPause('AI room instance is no longer available.');
    return legacy;
  }
  private inRoom<T>(roomID: string, operation: () => T): T {
    return withCodexInstance(this.instanceFor(roomID), operation);
  }
  private async freeInstances(roomID?: string) {
    const instances = configuredCodexInstances();
    const busy = new Map<string, string>();
    // Single-instance deployments also use local room status; named pools read cross-process leases.
    if (instances[0].id !== 'default') {
      for (const lease of await this.repository!.busyInstances()) busy.set(lease.instanceID, lease.roomID);
    }
    for (const [id, instance] of this.roomInstances) busy.set(instance.id, id);
    for (const room of Object.values(this.manager.rooms)) {
      if (room.ai && (['ready', 'running', 'paused'].includes(room.ai.status) || this.running.has(room.roomID)))
        busy.set(this.roomInstances.get(room.roomID)?.id ?? 'default', room.roomID);
    }
    return instances.filter(
      (instance) => !this.allocating.has(instance.id) && (!busy.has(instance.id) || busy.get(instance.id) === roomID),
    );
  }
  private async instanceSnapshots(instances: CodexInstance[]) {
    return Promise.all(
      instances.map((instance) =>
        withCodexInstance(instance, async () => {
          const [quota, models] = await Promise.allSettled([getCodexWeeklyLimit(), getCodexModels()]);
          return {
            instance,
            quota: quota.status === 'fulfilled' ? quota.value : null,
            models: models.status === 'fulfilled' ? models.value : [],
          };
        }),
      ),
    );
  }
  private async reserveInstance(roomID: string, publicGame: boolean, mode?: AiBotMode, settings?: CodexSettings) {
    const thresholds = publicGame ? await this.repository!.getBotQuotaThresholds() : defaultBotQuotaThresholds;
    const free = await this.freeInstances();
    const snapshots =
      !publicGame && !settings && free.length === 1 && free[0].id === 'default'
        ? [{ instance: free[0], quota: null, models: [] }]
        : await this.instanceSnapshots(free);
    const candidates = snapshots.filter(({ instance, quota, models }) =>
      publicGame
        ? mode
          ? humanModeAvailable(mode, quota, models, thresholds)
          : humanModeAvailable('smart', quota, models, thresholds) ||
            humanModeAvailable('regular', quota, models, thresholds)
        : (instance.id === 'default' ||
            (quota &&
              Number.isFinite(quota.remainingPercent) &&
              quota.remainingPercent > 0 &&
              models.length > 0 &&
              (quota.shortTerm === null ||
                (quota.shortTerm &&
                  Number.isFinite(quota.shortTerm.remainingPercent) &&
                  quota.shortTerm.remainingPercent > 0)))) &&
          (!settings ||
            models.some((model) => model.id === settings.model && model.efforts.includes(settings.reasoning))),
    );
    candidates.sort((a, b) => this.compareQuota(a.quota, b.quota));
    for (const { instance } of candidates) {
      if (this.allocating.has(instance.id) || [...this.roomInstances.values()].some((held) => held.id === instance.id))
        continue;
      this.allocating.add(instance.id);
      try {
        await this.claimInstance(roomID, instance);
        this.roomInstances.set(roomID, instance);
        return instance;
      } catch (error) {
        if (!(error instanceof AiPause)) throw error;
      } finally {
        this.allocating.delete(instance.id);
      }
    }
    throw new AiPause('Bot games are currently unavailable: no free eligible ChatGPT instance.');
  }
  private compareQuota(a: CodexWeeklyLimit | null, b: CodexWeeklyLimit | null) {
    // Weekly-only subscriptions rank by their available weekly percentage.
    const short = (quota: CodexWeeklyLimit | null) =>
      quota?.shortTerm?.remainingPercent ?? quota?.remainingPercent ?? -1;
    return short(b) - short(a) || (b?.remainingPercent ?? -1) - (a?.remainingPercent ?? -1);
  }
  private claimInstance(roomID: string, instance = this.instanceFor(roomID)) {
    return instance.id === 'default' ? this.repository!.claim(roomID) : this.repository!.claim(roomID, instance.id);
  }
  private async releaseInstance(roomID: string) {
    try {
      await this.repository!.release(roomID);
    } finally {
      this.roomInstances.delete(roomID);
    }
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

  private async humanModes(roomID: string) {
    const thresholds = await this.repository!.getBotQuotaThresholds();
    const snapshot = (await this.instanceSnapshots([this.instanceFor(roomID)]))[0];
    return {
      smart: humanModeAvailable('smart', snapshot.quota, snapshot.models, thresholds),
      regular: humanModeAvailable('regular', snapshot.quota, snapshot.models, thresholds),
      beginner: humanModeAvailable('beginner', snapshot.quota, snapshot.models, thresholds),
    };
  }

  private async humanAvailability(roomID?: string) {
    const thresholds = await this.repository!.getBotQuotaThresholds();
    const free = await this.freeInstances(roomID);
    const snapshots = await this.instanceSnapshots(free);
    // Allocations can finish while metadata is being read.
    const stillFree = new Set((await this.freeInstances(roomID)).map((instance) => instance.id));
    const available = snapshots.filter(({ instance }) => stillFree.has(instance.id));
    const botModes = { smart: false, regular: false, beginner: false };
    const botModeAvailableAt: Partial<Record<AiBotMode, number>> = {};
    for (const difficulty of ['smart', 'regular', 'beginner'] as const) {
      botModes[difficulty] = available.some(({ quota, models }) =>
        humanModeAvailable(difficulty, quota, models, thresholds),
      );
      if (!botModes[difficulty]) {
        const resets = available.flatMap(({ quota, models }) => {
          const at = humanModeAvailableAt(difficulty, quota, models, thresholds);
          return at === undefined ? [] : [at];
        });
        if (resets.length) botModeAvailableAt[difficulty] = Math.min(...resets);
      }
    }
    return { botModes, botModeAvailableAt, botsBusy: stillFree.size === 0 };
  }

  private publicRoom(room: BotRoom) {
    return Boolean(room.ai?.publicBotGame || room.ai?.botDifficulty);
  }

  private clearDraftLeaseTimer(id: string) {
    clearTimeout(this.draftLeaseTimers.get(id));
    this.draftLeaseTimers.delete(id);
  }

  private retainDraftLease(room: BotRoom) {
    const id = room.roomID;
    this.clearDraftLeaseTimer(id);
    const timer = setTimeout(async () => {
      if (this.draftLeaseTimers.get(id) !== timer || this.manager.rooms[id] !== room || room.ai?.status !== 'ready')
        return;
      try {
        await room.renewLease!();
        if (this.draftLeaseTimers.get(id) === timer && room.ai?.status === 'ready') this.retainDraftLease(room);
      } catch {
        if (this.draftLeaseTimers.get(id) === timer) {
          await this.expireLaunch(room, 'Could not retain AI room ownership.').catch(() => {});
        }
      }
    }, 60000);
    timer.unref();
    this.draftLeaseTimers.set(id, timer);
  }

  private clearLaunchTimer(id: string) {
    clearTimeout(this.launchTimers.get(id));
    this.launchTimers.delete(id);
  }

  private async expireLaunch(room: BotRoom, reason = 'Bot game preparation timed out.') {
    if (this.manager.rooms[room.roomID] !== room || room.ai?.status !== 'ready') return;
    this.clearLaunchTimer(room.roomID);
    this.clearDraftLeaseTimer(room.roomID);
    delete room.ai.launchExpiresAt;
    room.stop(reason);
    this.starting.delete(room.roomID);
    try {
      await this.repository!.save(room.calculateRoomState());
    } finally {
      await this.releaseInstance(room.roomID).catch(() => {});
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
    this.technicalStarts.delete(id);
    this.starting.delete(id);
    try {
      room.stop(aiText(room.ai.language).pauseExpired);
      await this.repository!.save(room.calculateRoomState());
    } finally {
      await this.releaseInstance(id).catch(() => {});
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
    const pipeline = decisionPipeline((request, options, signal) =>
      codexDecide(id, this.repository!, undefined, () => room.ai?.codex)(request, options, signal),
    );
    const room: BotRoom = new BotRoom(
      id,
      owner,
      this.manager.io,
      pipeline,
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
    );
    room.resolvePlayerName = async (playerID) => (await this.manager.dbManager.getUserByID(playerID)).name;
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
    this.clearDraftLeaseTimer(id);
    this.running.add(id);
    // run changes status synchronously before the first await: duplicate starts cannot spend twice.
    void this.inRoom(id, () =>
      room
        .run(technical)
        .catch(() => {
          /* room.run already exposes a sanitized paused status */
        })
        .finally(async () => {
          if (this.manager.rooms[id] === room && room.ai?.status === 'paused') {
            try {
              await room.renewLease?.();
              if (this.manager.rooms[id] === room && room.ai?.status === 'paused') this.schedulePauseExpiry(room);
            } catch {
              room.stop('Could not retain AI room ownership.');
              await this.repository!.save(room.calculateRoomState()).catch(() => {});
            }
          }
          try {
            if (room.ai?.status === 'finished' || room.ai?.status === 'stopped')
              await this.releaseInstance(id).catch(() => {});
          } finally {
            this.running.delete(id);
            this.manager.updateRoomsList(room);
          }
        }),
    );
  }

  register(socket: ServerSocket, userID?: string) {
    socket.on('getLobbyAiAccess', async (id, cb) => {
      if (typeof cb !== 'function') return;
      if (!validPacket('getLobbyAiAccess', [id, cb])) return cb({ error: 'invalidRequest' });
      try {
        const room = this.manager.rooms[id];
        if (
          !room ||
          room.ai ||
          room.nextRoomID ||
          room.leaderID !== userID ||
          !['created', 'locked'].includes(room.data.stage) ||
          !room.players.includes(userID!)
        )
          return cb({ error: 'Lobby AI access denied' });
        if (!(await this.canPlay(userID))) return cb({ error: 'AI room access denied' });
        const [hostPremium, availability] = await Promise.all([
          this.canPlayLargeTables(userID!),
          this.humanAvailability(),
        ]);
        if (
          this.manager.rooms[id] !== room ||
          room.ai ||
          room.leaderID !== userID ||
          !['created', 'locked'].includes(room.data.stage) ||
          !room.players.includes(userID!)
        )
          return cb({ error: 'Lobby changed' });
        cb({ available: availability.botModes.smart, hostPremium, humanPlayerIDs: [...room.players] });
      } catch {
        cb({ error: 'Could not load lobby bot availability' });
      }
    });
    socket.on('startLobbyAiRoom', async (id, options, cb) => {
      if (typeof cb !== 'function') return;
      if (!validPacket('startLobbyAiRoom', [id, options, cb])) return cb({ error: 'invalidRequest' });
      const original = this.manager.rooms[id];
      if (!userID || !original || original.leaderID !== userID) return cb({ error: 'Lobby AI access denied' });
      if (original instanceof BotRoom && this.lobbyRooms.has(original)) {
        return cb(
          original.ai!.playerCount === options.playerCount &&
            original.ai!.language === options.language &&
            original.humanIDs.length === options.humanPlayerIDs.length &&
            original.humanIDs.every((human, index) => human === options.humanPlayerIDs[index])
            ? { ok: true }
            : { error: 'This lobby has already launched' },
        );
      }
      if (this.starting.has(id)) return cb({ error: 'AI room control in progress' });
      const humans = [...options.humanPlayerIDs];
      const stage = original.data.stage;
      const unchanged = () =>
        this.manager.rooms[id] === original &&
        !original.ai &&
        !original.nextRoomID &&
        original.leaderID === userID &&
        original.data.stage === stage &&
        ['created', 'locked'].includes(stage) &&
        original.players.includes(userID) &&
        original.players.length === humans.length &&
        humans.every((human, index) => original.players[index] === human && !getBotProfile(human)) &&
        !humans.some((human) => this.active(human));
      if (!unchanged()) return cb({ error: 'Lobby or confirmed players changed' });
      const size = lobbyAiSizes(humans.length, true).find((size) => size.playerCount === options.playerCount);
      if (!size) return cb({ error: 'At least one human and one bot are required' });
      this.starting.add(id);
      let claimed = false;
      let adopted = false;
      try {
        if (!(await this.canPlay(userID))) return cb({ error: 'AI room access denied' });
        const hostPremium = await this.canPlayLargeTables(userID);
        if (
          lobbyAiSizes(humans.length, hostPremium).find((size) => size.playerCount === options.playerCount)
            ?.requiresPremium
        )
          return cb({ error: 'Host Premium is required for more than two bots at seven or eight seats' });
        if (!unchanged()) return cb({ error: 'Lobby or confirmed players changed' });
        await this.beginnerAnalysis?.cancelAll();
        await this.reserveInstance(id, true, 'smart');
        claimed = true;
        // Drain preceding lobby chat writes, then adopt the latest cache object at the synchronous swap.
        await this.manager.chatService?.history(id, original.chat.history);
        if (!unchanged()) return cb({ error: 'Lobby or confirmed players changed' });
        const room = this.createRoom(id, userID, options.language, options.playerCount);
        room.createAt = original.createAt;
        room.chat = original.chat;
        if (!this.manager.chatService && original.persistChatMessage)
          room.persistChatMessage = original.persistChatMessage;
        const previousChat = original.onChatMessage;
        const aiChat = room.onChatMessage;
        room.onChatMessage = (entry) => {
          previousChat?.call(original, entry);
          aiChat?.(entry);
        };
        room.ai!.publicBotGame = true;
        room.ai!.humanPlayerID = userID;
        room.ai!.humanPlayerIDs = humans;
        room.ai!.humanSeats = humans.length;
        room.ai!.withFriend = humans.length > 1;
        room.ai!.botDifficulty = 'smart';
        room.ai!.preparedDifficulty = 'smart';
        room.ai!.codex = { ...humanSettings.smart };
        room.ai!.title = `${humans.length} Humans vs ${size.botCount} Bots`;
        delete room.ai!.profileRatingSeason;
        humans.forEach((human, index) => {
          room.players[room.players.length - 1 - index] = human;
        });
        this.manager.rooms[id] = room;
        this.lobbyRooms.add(room);
        adopted = true;
        this.runRoom(room);
        this.manager.updateRoomsList(room);
        cb({ ok: true });
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not start lobby AI game' });
      } finally {
        this.starting.delete(id);
        if (claimed && !adopted) await this.releaseInstance(id).catch(() => {});
      }
    });
    socket.on('setAiBotQuotaThresholds', async (thresholds, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (!validBotQuotaThresholds(thresholds)) return cb({ error: 'Invalid bot quota thresholds' });
        await this.repository!.setBotQuotaThresholds(thresholds);
        cb({ ok: true });
      } catch {
        cb({ error: 'Could not save bot quota thresholds' });
      }
    });
    socket.on('getAiBotDashboard', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        const thresholds = await this.repository!.getBotQuotaThresholds();
        const snapshots = await this.instanceSnapshots(configuredCodexInstances());
        // Read leases after metadata: a reservation may complete while quota is loading.
        const busy = new Map((await this.repository!.busyInstances()).map((lease) => [lease.instanceID, lease.roomID]));
        for (const [roomID, instance] of this.roomInstances) busy.set(instance.id, roomID);
        for (const room of Object.values(this.manager.rooms)) {
          if (room.ai && (['ready', 'running', 'paused'].includes(room.ai.status) || this.running.has(room.roomID)))
            busy.set(this.roomInstances.get(room.roomID)?.id ?? 'default', room.roomID);
        }
        const instances = snapshots.map<AiBotInstanceStatus>(({ instance, quota, models }) => {
          const modes = {
            smart: humanModeAvailable('smart', quota, models, thresholds),
            regular: humanModeAvailable('regular', quota, models, thresholds),
            beginner: humanModeAvailable('beginner', quota, models, thresholds),
          };
          const roomID = busy.get(instance.id);
          const room = roomID ? this.manager.rooms[roomID] : undefined;
          return {
            id: instance.id,
            status:
              roomID || this.allocating.has(instance.id)
                ? 'busy'
                : Object.values(modes).some(Boolean)
                  ? 'free'
                  : 'unavailable',
            quota,
            modes,
            ...(roomID ? { roomID } : {}),
            ...(room?.ai
              ? {
                  room: {
                    status: room.ai.status,
                    title: room.ai.title,
                    codex: room.ai.codex,
                    playerCount: room.players.length,
                    thinking: Boolean(room.ai.thinkingPlayerID || room.ai.thinkingPlayerIDs?.length),
                    waitingForHuman: Boolean(room.ai.waitingForHuman || room.ai.waitingForDiscussion),
                  },
                }
              : {}),
          };
        });
        // Recheck authority before returning a potentially slow metadata request.
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        cb({ checkedAt: Date.now(), instances, thresholds });
      } catch {
        cb({ error: 'Could not load bot dashboard' });
      }
    });
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
    socket.on('getBeginnerReview', async (id, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (
          !userID ||
          !codexEnabled() ||
          !this.beginnerAnalysis ||
          typeof id !== 'string' ||
          !/^[a-zA-Z0-9-]{1,80}$/.test(id)
        )
          return cb({ status: 'unavailable' });
        const live = this.manager.rooms[id];
        const state = live ? live.calculateRoomState() : await this.archiveRepository?.load(id);
        if (!state || !buildBeginnerAnalysis(state, userID)) return cb({ status: 'unavailable' });
        const cached = await this.beginnerAnalysis.get(state, userID, false);
        if (cached.status === 'complete') return cb(cached);
        const reviewID = randomUUID();
        // Reserve before generating/inserting a pending review: busy or depleted accounts
        // must not permanently cache a failed analysis that never reached a model.
        await this.reserveInstance(reviewID, false, undefined, beginnerAnalysisSettings);
        try {
          cb(await this.inRoom(reviewID, () => this.beginnerAnalysis!.get(state, userID, true)));
        } finally {
          await this.releaseInstance(reviewID);
        }
      } catch {
        cb({ status: 'unavailable' });
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
        const own = this.active(userID);
        if (own) return cb({ weekly: await this.inRoom(own.roomID, () => getCodexWeeklyLimit()) });
        const instances = configuredCodexInstances();
        if (instances[0].id === 'default') return cb({ weekly: await getCodexWeeklyLimit() });
        const snapshots = await this.instanceSnapshots(await this.freeInstances());
        snapshots.sort((a, b) => this.compareQuota(a.quota, b.quota));
        cb({ weekly: snapshots[0]?.quota ?? null });
      } catch {
        cb({ error: 'Could not load Codex limits' });
      }
    });
    socket.on('getAiCodexModels', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!codexEnabled() || !(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        const own = this.active(userID);
        if (own) return cb({ models: await this.inRoom(own.roomID, () => getCodexModels()) });
        const instances = configuredCodexInstances();
        if (instances[0].id === 'default') return cb({ models: await getCodexModels() });
        const snapshots = await this.instanceSnapshots(await this.freeInstances());
        snapshots.sort((a, b) => this.compareQuota(a.quota, b.quota));
        cb({ models: snapshots[0]?.models ?? [] });
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'Could not load Codex models' });
      }
    });
    socket.on('getAiRoomAccess', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        const canManage = await this.canManage(userID);
        const canPlay = await this.canPlay(userID);
        const own = userID ? this.active(userID) : undefined;
        const ownRoomID =
          own instanceof BotRoom && this.publicRoom(own) && own.isHuman(userID!) ? own.roomID : undefined;
        const eligibleOwn = ownRoomID && this.launchReady(own as BotRoom) && !this.starting.has(ownRoomID);
        const availability =
          canPlay && (!ownRoomID || eligibleOwn) && !this.creating.has(userID!)
            ? await this.humanAvailability(eligibleOwn ? ownRoomID : undefined)
            : { botModes: { smart: false, regular: false, beginner: false }, botModeAvailableAt: {}, botsBusy: true };
        const { botModes, botsBusy } = availability;
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
                roomID: this.active(userID)?.roomID,
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
              humanSeats?: number;
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
        (options.humanSeats !== undefined &&
          (!options.withFriend ||
            !Number.isInteger(options.humanSeats) ||
            options.humanSeats < 2 ||
            options.humanSeats >= (options.playerCount ?? 5))) ||
        (options.beginner && options.withFriend === true) ||
        (options.difficulty !== undefined && !['regular', 'smart'].includes(options.difficulty)) ||
        (options.language !== undefined && !['en', 'ru', 'zh-tw', 'es', 'vi'].includes(options.language)) ||
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
        const active = this.active(userID);
        if (active)
          return cb(
            active instanceof BotRoom && this.publicRoom(active) && Boolean(userID && active.isHuman(userID))
              ? { roomID: active.roomID }
              : { error: 'Another AI match is already active' },
          );
        if (this.creating.has(userID!)) return cb({ error: 'AI room control in progress' });
        if (Object.keys(this.manager.rooms).length >= 500) return cb({ error: 'Room limit reached' });
        this.creating.add(userID!);
        locked = true;
        await this.beginnerAnalysis?.cancelAll();
        const profile = await this.manager.dbManager.getUserByID(userID!);
        if (Object.keys(this.manager.rooms).length >= 500) return cb({ error: 'Room limit reached' });
        const id = randomUUID();
        await this.reserveInstance(id, true, options.beginner ? 'beginner' : options.difficulty);
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
        if (claimedID && !this.running.has(claimedID)) await this.releaseInstance(claimedID).catch(() => {});
        cb({ error: error instanceof AiPause ? error.message : 'Could not create AI room' });
      } finally {
        if (locked) this.creating.delete(userID!);
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
          !['en', 'ru', 'zh-tw', 'es', 'vi'].includes(options.language)
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
        if (room.ai!.withFriend && (room.ai!.humanSeats ?? 2) >= playerCount)
          return cb({ error: 'At least one bot seat is required' });
        if (room.ai!.beginner && (options.difficulty !== 'regular' || playerCount !== 5))
          return cb({ error: 'Beginner games require regular bots and five players' });
        if (playerCount >= 7 && !(await this.canPlayLargeTables(userID!)))
          return cb({ error: 'Premium is required for seven or eight players' });
        if (!this.launchReady(room)) {
          await this.expireLaunch(room);
          return cb({ error: 'The bot game preparation time has expired' });
        }
        if (this.starting.has(id) || this.running.has(id)) return cb({ error: 'AI room control in progress' });
        this.starting.add(id);
        locked = true;
        const instance = this.instanceFor(id);
        const modes = await this.humanModes(id);
        if (!this.launchReady(room)) {
          await this.expireLaunch(room);
          return cb({ error: 'The bot game preparation time has expired' });
        }
        const mode = room.ai!.beginner ? 'beginner' : options.difficulty;
        if (!modes[mode]) return cb({ error: 'This bot mode is currently unavailable' });
        await this.claimInstance(id, instance);
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
        if (locked) this.starting.delete(id);
        if (claimed && !this.running.has(id) && !this.launchReady(this.manager.rooms[id] as BotRoom))
          await this.releaseInstance(id).catch(() => {});
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
          if (!['en', 'ru', 'zh-tw', 'es', 'vi'].includes(options.language))
            return cb({ error: 'Invalid AI language' });
          if (Object.prototype.hasOwnProperty.call(options, 'playerCount')) {
            if (typeof options.playerCount !== 'number' || ![5, 6, 7, 8].includes(options.playerCount))
              return cb({ error: 'Invalid AI player count' });
            playerCount = options.playerCount;
          }
          selectedModel = options.model;
          language = options.language;
        }
        if (selectedModel !== CODEX_MODEL) return cb({ error: 'Only Codex is supported' });
        if (this.active(userID)) return cb({ roomID: this.active(userID)!.roomID });
        if (this.creating.has(userID!)) return cb({ error: 'AI room is being created' });
        this.creating.add(userID!);
        try {
          await this.beginnerAnalysis?.cancelAll();
          const id = randomUUID();
          const instance = await this.reserveInstance(id, false);
          const room = this.createRoom(id, userID!, language, playerCount);
          this.manager.rooms[id] = room;
          if (instance.id !== 'default') this.retainDraftLease(room);
          this.manager.updateRoomsList(room);
          cb({ roomID: id });
        } finally {
          this.creating.delete(userID!);
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
        if (this.starting.has(id) || this.running.has(id)) return cb({ error: 'AI room control in progress' });
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
          this.starting.has(id)
        )
          return cb({ error: 'Codex settings can only be changed before launch' });
        const validated = validateCodexSettings(settings, await this.inRoom(id, () => getCodexModels()));
        // Catalog lookup is asynchronous: recheck before changing a possibly started room.
        if (room.ai.status !== 'ready' || this.starting.has(id)) return cb({ error: 'AI room control in progress' });
        this.starting.add(id);
        const previous = room.ai.codex;
        room.ai.codex = validated;
        try {
          await this.repository!.save(room.calculateRoomState());
        } catch (error) {
          room.ai.codex = previous;
          throw error;
        } finally {
          this.starting.delete(id);
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
        if (this.starting.has(id)) return cb({ error: 'AI room control in progress' });
        if (action === 'stop') {
          this.clearLaunchTimer(id);
          this.clearPauseTimer(id);
          this.clearDraftLeaseTimer(id);
          delete room.ai!.launchExpiresAt;
          room.stop();
          try {
            await this.repository!.save(room.calculateRoomState());
          } finally {
            if (!this.running.has(id)) {
              await this.releaseInstance(id);
            }
            this.manager.updateRoomsList(room);
          }
          return cb({ ok: true });
        }
        const technical = action === 'resumeTechnical';
        if (!technical && this.publicRoom(room)) return cb({ error: 'Choose a bot mode and language before launch' });
        if (
          this.running.has(id) ||
          (technical
            ? room.ai?.status !== 'paused' || !room.ai.canResumeTechnical
            : action !== 'start' || room.ai?.status !== 'ready')
        )
          return cb({ error: 'AI room is not ready to start or resume' });
        if (room.ai?.model === CODEX_MODEL && !room.ai.codex)
          return cb({ error: 'Choose a Codex model and reasoning level before launch' });
        this.starting.add(id);
        const technicalStart = technical ? { roomID: id } : undefined;
        if (technicalStart) this.technicalStarts.set(id, technicalStart);
        try {
          if (!technical && room.ai?.botDifficulty && !(await this.humanModes(id))[room.ai.botDifficulty])
            return cb({ error: 'This bot mode is currently unavailable' });
          if (room.ai?.status !== (technical ? 'paused' : 'ready')) return cb({ error: 'AI room control in progress' });
          await this.claimInstance(id);
          const pause = this.pauseTimers.get(id);
          if (technical && pause && pause.expiresAt <= Date.now()) await this.expirePause(room, pause.timer);
          if (
            this.manager.rooms[id] !== room ||
            room.ai?.status !== (technical ? 'paused' : 'ready') ||
            (technical && (this.technicalStarts.get(id) !== technicalStart || !room.ai.canResumeTechnical))
          ) {
            await this.releaseInstance(id).catch(() => {});
            return cb({ error: 'AI room is no longer ready to start or resume' });
          }
          this.runRoom(room, technical);
          this.manager.updateRoomsList(room);
          cb({ ok: true });
        } finally {
          if (!technicalStart || this.technicalStarts.get(id) === technicalStart) {
            this.technicalStarts.delete(id);
            this.starting.delete(id);
          }
        }
      } catch (error) {
        cb({ error: error instanceof AiPause ? error.message : 'AI room control failed' });
      }
    });
  }
}
