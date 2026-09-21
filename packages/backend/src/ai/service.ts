import type { ServerSocket } from '@avalon/types';
import type { Manager } from '@/main';
import { randomUUID } from 'crypto';
import { AiRepository } from './repository';
import { BotRoom } from './room';
import { AiPause, yandexDecide } from './client';

export class AiService {
  repository?: AiRepository;
  private creating = false;
  private starting = false;
  constructor(private manager: Manager) {
    const db = manager.dbManager.dbInstance?.connection.db;
    if (process.env.AI_ROOMS_ENABLED === 'true' && db && process.env.YANDEX_API_KEY && process.env.YANDEX_FOLDER_ID)
      this.repository = new AiRepository(
        db,
        Number(process.env.AI_TOTAL_BUDGET_RUB || 500),
        Math.min(50, Number(process.env.AI_MATCH_BUDGET_RUB || 50)),
      );
  }
  private active() {
    return Object.values(this.manager.rooms).find((r) => r.ai && ['ready', 'running', 'paused'].includes(r.ai.status));
  }
  async canManage(userID?: string): Promise<boolean> {
    if (!this.repository || !userID) return false;
    const allowed = (process.env.AI_ROOM_ADMIN_LOGINS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.length) return false;
    const profile = await this.manager.dbManager.getUserProfile(userID);
    return allowed.includes(profile.login.toLowerCase());
  }
  register(socket: ServerSocket, userID?: string) {
    socket.on('getAiRoomAccess', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        cb({ canManage: await this.canManage(userID), roomID: this.active()?.roomID });
      } catch {
        cb({ canManage: false });
      }
    });
    socket.on('createAiRoom', async (cb) => {
      if (typeof cb !== 'function') return;
      try {
        if (!(await this.canManage(userID))) return cb({ error: 'AI room access denied' });
        if (this.active()) return cb({ roomID: this.active()!.roomID });
        if (this.creating) return cb({ error: 'AI room is being created' });
        this.creating = true;
        try {
          const id = randomUUID();
          await this.repository!.claim(id);
          const room = new BotRoom(
            id,
            userID!,
            this.manager.io,
            yandexDecide(id, this.repository!, (rub) => {
              room.ai!.costRub = rub;
            }),
            (state) => this.repository!.save(state),
            10000,
          );
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
        const room = this.manager.rooms[id];
        if (!(room instanceof BotRoom)) return cb({ error: 'AI room not found' });
        if (action === 'stop') {
          room.stop();
          await this.repository!.save(room.calculateRoomState());
          await this.repository!.release(id);
          this.manager.updateRoomsList(room);
          return cb({ ok: true });
        }
        if (action !== 'start' || room.ai?.status !== 'ready' || this.starting)
          return cb({ error: 'AI room is not ready' });
        this.starting = true;
        try {
          await this.repository!.claim(id);
          // run changes status synchronously before the first await: duplicate starts cannot spend twice.
          void room
            .run()
            .catch(() => {
              /* room.run already exposes a sanitized paused status */
            })
            .finally(async () => {
              this.manager.updateRoomsList(room);
              await this.repository!.release(id).catch(() => {});
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
