import { aiModel, AI_MODELS, DEFAULT_AI_MODEL } from './models';
import type { ServerSocket, TRoomInfo } from '@avalon/types';
import type { Manager } from '@/main';
import { randomUUID } from 'crypto';
import { AiRepository } from './repository';
import { BotRoom } from './room';
import { AiPause } from './client';
import { separatedDecide } from './pipeline';

export class AiService {
  repository?: AiRepository;
  private creating = false;
  private starting = false;
  private running = new Set<string>();
  constructor(private manager: Manager) {
    const db = manager.dbManager.dbInstance?.connection.db;
    if (process.env.AI_ROOMS_ENABLED === 'true' && db && process.env.YANDEX_API_KEY && process.env.YANDEX_FOLDER_ID)
      this.repository = new AiRepository(
        db,
        Number(process.env.AI_TOTAL_BUDGET_RUB || (process.env.NODE_ENV === 'production' ? 3000 : 700)),
        Number(process.env.AI_MATCH_BUDGET_RUB || (process.env.NODE_ENV === 'production' ? 200 : 100)),
        process.env.NODE_ENV === 'production' ? { periodDays: 30, ledgerID: 'avalon-ai-production-v1' } : {},
      );
  }
  private active() {
    return Object.values(this.manager.rooms).find((r) => r.ai && ['ready', 'running', 'paused'].includes(r.ai.status));
  }
  async canManage(userID?: string): Promise<boolean> {
    if (!this.repository || !userID) return false;
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
        const archived = (await this.repository?.recent(20)) || [];
        const live = Object.values(this.manager.rooms)
          .filter((room) => room.ai)
          .map((room) => room.calculateRoomState());
        const rooms = [...new Map([...archived, ...live].map((room) => [room.roomID, room])).values()]
          .filter((room) => room.ai)
          .sort((a, b) => Date.parse(b.createAt) - Date.parse(a.createAt))
          .slice(0, 20)
          .map<TRoomInfo>((room) => ({
            uuid: room.roomID,
            ai: true,
            aiStatus: room.ai?.status,
            aiModel: room.ai?.model,
            hostID: room.leaderID,
            state: room.stage,
            options: room.options,
            players: room.players.length,
            createAt: room.createAt,
            startAt: room.stage === 'started' ? room.startAt : undefined,
            result: room.stage === 'started' ? room.game.result : undefined,
          }));
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
        room.data.stage !== 'started' ||
        (userID !== undefined && room.players.includes(userID))
      )
        return cb({ error: 'AI spectator roles unavailable' });
      cb({
        roles: Object.fromEntries(room.data.manager.game.players.map((p) => [p.userID, p.role.role])),
        decisions: room.spectatorDecisions,
      });
    });
    socket.on('getAiBudget', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        cb({ budget: await this.repository!.budget() });
      } catch {
        cb({ error: 'Could not load AI budget' });
      }
    });
    socket.on('getAiRoomCosts', async (ids, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (
          !Array.isArray(ids) ||
          ids.length > 50 ||
          ids.some((id) => typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id))
        )
          return cb({ error: 'Invalid room IDs' });
        const costs: Record<string, number> = {};
        const limits: Record<string, number> = {};
        for (const id of new Set(ids)) {
          const state = this.manager.rooms[id] || (await this.repository!.load(id));
          if (state?.ai && typeof state.ai.costRub === 'number') {
            costs[id] = state.ai.costRub;
            limits[id] = await this.repository!.roomLimit(id);
          }
        }
        cb({ costs, limits });
      } catch {
        cb({ error: 'Could not load AI costs' });
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
                models: Object.entries(AI_MODELS).map(([id, model]) => ({ id, label: model.label })),
                defaultModel: Object.prototype.hasOwnProperty.call(AI_MODELS, process.env.YANDEX_MODEL || '')
                  ? process.env.YANDEX_MODEL
                  : DEFAULT_AI_MODEL,
              }
            : { canManage },
        );
      } catch {
        cb({ canManage: false });
      }
    });
    socket.on('createAiRoom', async (selectedModel, cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (typeof selectedModel !== 'string') return cb({ error: 'Invalid AI model' });
        if (this.active()) return cb({ roomID: this.active()!.roomID });
        if (this.creating || this.starting || this.running.size) return cb({ error: 'AI room is being created' });
        this.creating = true;
        try {
          let model: string;
          try {
            model = aiModel(selectedModel).id;
          } catch (error) {
            throw new AiPause((error as Error).message);
          }
          const id = randomUUID();
          await this.repository!.claim(id);
          const room = new BotRoom(
            id,
            userID!,
            this.manager.io,
            separatedDecide(
              id,
              this.repository!,
              (rub) => {
                room.ai!.costRub = rub;
              },
              model,
            ),
            (state) => this.repository!.save(state),
            process.env.NODE_ENV === 'development' ? 2000 : 10000,
          );
          room.ai!.model = model;
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
        const resume = action === 'resumeBudget';
        const technical = action === 'resumeTechnical';
        if (
          this.running.size ||
          this.creating ||
          (resume || technical
            ? room.ai?.status !== 'paused' || !(resume ? room.ai.canResumeBudget : room.ai.canResumeTechnical)
            : action !== 'start' || room.ai?.status !== 'ready')
        )
          return cb({ error: 'AI room is not ready to start or resume' });
        this.starting = true;
        try {
          await this.repository!.claim(id);
          if (resume) {
            try {
              await this.repository!.doubleMatchLimit(id, room.budgetResumeUnits);
            } catch (error) {
              await this.repository!.release(id);
              throw error;
            }
          }
          this.running.add(id);
          // run changes status synchronously before the first await: duplicate starts cannot spend twice.
          void room
            .run(resume, technical)
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
