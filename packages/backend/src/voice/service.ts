import { randomUUID } from 'node:crypto';
import { AccessToken, TokenVerifier, TrackSource } from 'livekit-server-sdk';
import type { VoiceConfig } from './config';
import type { VoiceState, VoiceJoin } from '@avalon/types';

export interface VoicePolicy {
  present: boolean;
  seated: boolean;
  admin: boolean;
  leader: boolean;
}
interface Dependencies {
  ready?(): boolean;
  policy(userID: string, socketID: string, roomID: string): Promise<VoicePolicy>;
  exists(roomID: string): boolean;
  remove(roomName: string, identity: string): Promise<unknown>;
  deleteRoom(roomName: string): Promise<unknown>;
  stateChanged(roomID: string): void;
  revoked(socketID: string, sessionID: string): void;
}
interface Session {
  id: string;
  userID: string;
  socketID: string;
  roomID: string;
  roomName: string;
  started: number;
}
export class VoiceService {
  private rooms = new Map<string, { name: string; enabled: boolean; blocked: boolean }>();
  private sessions = new Map<string, Session>();
  private closers = new Map<string, Set<() => void>>();
  private retries = new Set<string>();
  private limits = new Map<string, { until: number; count: number }>();
  private pending = new Set<{ userID: string; socketID: string; roomID: string; cancelled: boolean }>();
  private reconciling = false;
  private lastReconciled = Date.now();
  healthy() {
    return (this.deps.ready?.() ?? true) && this.retries.size === 0 && Date.now() - this.lastReconciled < 15000;
  }
  constructor(
    readonly config: VoiceConfig | undefined,
    private deps: Dependencies,
  ) {}
  private async policy(userID: string, socketID: string, roomID: string) {
    if (!userID || !this.deps.exists(roomID)) throw Error('forbidden');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const policy = await Promise.race([
      this.deps.policy(userID, socketID, roomID),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(Error('unavailable')), 3000);
      }),
    ]).finally(() => clearTimeout(timer));
    if (!policy.present || !this.deps.exists(roomID)) throw Error('forbidden');
    return policy;
  }
  async state(userID: string, socketID: string, roomID: string): Promise<VoiceState> {
    const p = await this.policy(userID, socketID, roomID);
    const room = this.rooms.get(roomID);
    const available = Boolean(this.config && (this.deps.ready?.() ?? true) && !room?.blocked);
    return {
      available,
      enabled: available && Boolean(room?.enabled),
      canJoin: available && (p.seated || p.admin),
      canManage: available && (p.leader || p.admin),
    };
  }
  limit(key: string, max = 12) {
    const now = Date.now();
    for (const [id, entry] of this.limits) if (entry.until < now) this.limits.delete(id);
    const entry = this.limits.get(key) || { until: now + 60000, count: 0 };
    if (this.limits.size >= 10000 && !this.limits.has(key)) throw Error('rateLimited');
    this.limits.set(key, entry);
    if (++entry.count > max) throw Error('rateLimited');
  }
  async setEnabled(userID: string, socketID: string, roomID: string, enabled: boolean) {
    if (typeof enabled !== 'boolean') throw Error('invalidRequest');
    const p = await this.policy(userID, socketID, roomID);
    if (!p.leader && !p.admin) throw Error('forbidden');
    if (!this.config || !(this.deps.ready?.() ?? true)) throw Error('unavailable');
    const room = this.rooms.get(roomID) || { name: randomUUID(), enabled: false, blocked: false };
    if (room.blocked) throw Error('unavailable');
    for (const join of this.pending) if (join.roomID === roomID) join.cancelled = true;
    room.enabled = enabled;
    this.rooms.set(roomID, room);
    if (!enabled) this.revokeRoom(roomID);
    this.deps.stateChanged(roomID);
    return this.state(userID, socketID, roomID);
  }
  async join(userID: string, socketID: string, roomID: string): Promise<VoiceJoin> {
    this.limit(`join:${userID}`);
    for (const join of this.pending) if (join.userID === userID) join.cancelled = true;
    const pending = { userID, socketID, roomID, cancelled: false };
    this.pending.add(pending);
    try {
      const state = await this.state(userID, socketID, roomID);
      if (!state.enabled || !this.config) throw Error('unavailable');
      if (!state.canJoin) throw Error('forbidden');
      const room = this.rooms.get(roomID)!;
      const session: Session = { id: randomUUID(), userID, socketID, roomID, roomName: room.name, started: Date.now() };
      const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
        identity: session.id,
        ttl: 60,
        metadata: JSON.stringify({ userID }),
      });
      token.addGrant({
        room: room.name,
        roomJoin: true,
        canSubscribe: true,
        canPublish: true,
        canPublishSources: [TrackSource.MICROPHONE],
        canPublishData: false,
        canUpdateOwnMetadata: false,
      });
      const jwt = await token.toJwt();
      const latest = await this.policy(userID, socketID, roomID);
      if (
        pending.cancelled ||
        this.rooms.get(roomID) !== room ||
        !(latest.seated || latest.admin) ||
        !room.enabled ||
        room.blocked
      )
        throw Error('forbidden');
      for (const previous of this.sessions.values()) if (previous.userID === userID) this.revoke(previous);
      this.sessions.set(session.id, session);
      return { url: this.config.publicUrl, token: jwt, sessionID: session.id };
    } finally {
      this.pending.delete(pending);
    }
  }
  async admit(token: string): Promise<string> {
    if (!this.config || typeof token !== 'string' || token.length > 8192) throw Error('forbidden');
    const claims = await new TokenVerifier(this.config.apiKey, this.config.apiSecret).verify(token);
    const session = this.sessions.get(claims.sub || '');
    if (!session || claims.video?.room !== session.roomName || claims.video?.roomJoin !== true)
      throw Error('forbidden');
    const state = await this.state(session.userID, session.socketID, session.roomID);
    if (!state.enabled || !state.canJoin || this.sessions.get(session.id) !== session) throw Error('forbidden');
    return session.id;
  }
  attach(id: string, close: () => void): () => void {
    if (!this.sessions.has(id)) {
      close();
      throw Error('forbidden');
    }
    const connections = this.closers.get(id) || new Set();
    connections.add(close);
    this.closers.set(id, connections);
    return () => {
      connections.delete(close);
      if (!connections.size) this.closers.delete(id);
    };
  }
  leave(userID: string, socketID: string, id: string) {
    const session = this.sessions.get(id);
    if (!session) return true as const;
    if (session.userID !== userID || session.socketID !== socketID) throw Error('forbidden');
    this.revoke(session);
    return true as const;
  }
  revokeSocket(socketID: string, roomID?: string) {
    for (const join of this.pending)
      if (join.socketID === socketID && (!roomID || join.roomID === roomID)) join.cancelled = true;
    for (const session of this.sessions.values())
      if (session.socketID === socketID && (!roomID || session.roomID === roomID)) this.revoke(session);
  }
  revokeRoom(roomID: string) {
    for (const join of this.pending) if (join.roomID === roomID) join.cancelled = true;
    for (const session of this.sessions.values()) if (session.roomID === roomID) this.revoke(session);
  }
  destroyRoom(roomID: string) {
    this.revokeRoom(roomID);
    this.rooms.delete(roomID);
    this.deps.stateChanged(roomID);
  }
  private revoke(session: Session) {
    if (!this.sessions.delete(session.id)) return;
    this.closers.get(session.id)?.forEach((close) => close());
    this.closers.delete(session.id);
    this.deps.revoked(session.socketID, session.id);
    // Structured operational record: no tokens, identities or audio.
    console.info(
      JSON.stringify({
        event: 'voice_session_ended',
        durationSeconds: Math.round((Date.now() - session.started) / 1000),
      }),
    );
    void this.deps.remove(session.roomName, session.id).catch(() => this.quarantine(session.roomID, session.roomName));
  }
  private quarantine(roomID: string, roomName: string) {
    this.retries.add(roomName);
    const room = this.rooms.get(roomID);
    if (room?.name === roomName && !room.blocked) {
      room.blocked = true;
      room.enabled = false;
      this.revokeRoom(roomID);
      this.deps.stateChanged(roomID);
    }
  }
  async reconcile(roomID?: string) {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      for (const session of Array.from(this.sessions.values())) {
        if (roomID && session.roomID !== roomID) continue;
        try {
          const state = await this.state(session.userID, session.socketID, session.roomID);
          if (!state.enabled || !state.canJoin) this.revoke(session);
        } catch {
          this.revoke(session);
        }
      }
      for (const name of this.retries) {
        try {
          await this.deps.deleteRoom(name);
          this.retries.delete(name);
          for (const [id, room] of this.rooms)
            if (room.name === name) {
              this.rooms.set(id, { name: randomUUID(), enabled: false, blocked: false });
              this.deps.stateChanged(id);
            }
        } catch {
          /* Stay fail-closed and retry on next tick. */
        }
      }
    } finally {
      this.lastReconciled = Date.now();
      this.reconciling = false;
    }
  }
}
