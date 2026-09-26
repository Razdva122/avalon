import { VoiceStartup } from './startup';
import { RoomServiceClient } from 'livekit-server-sdk';
import type { Manager } from '@/main';
import type { ServerSocket, VoiceError } from '@avalon/types';
import { authenticatedUser } from '@/user/sessions';
import { voiceConfig } from './config';
import { VoiceService } from './service';
import { createVoiceGateway } from './gateway';

export function createRoomVoice(manager: Manager) {
  const config = voiceConfig();
  const client = config
    ? new RoomServiceClient(config.internalUrl, config.apiKey, config.apiSecret, { requestTimeout: 5 })
    : undefined;
  const startup = client ? new VoiceStartup(client) : undefined;
  const service = new VoiceService(config, {
    ready: () => startup?.ready ?? false,
    exists: (id) => Boolean(manager.rooms[id] && !manager.rooms[id].nextRoomID),
    policy: async (userID, socketID, roomID) => {
      const socket = manager.io.sockets.sockets.get(socketID);
      if (!socket?.data.authUser || socket.data.authUser.id !== userID) throw Error('forbidden');
      const user = await authenticatedUser(socket.handshake.auth.token);
      const profile = await manager.dbManager.getUserByID(userID);
      const room = manager.rooms[roomID];
      return {
        present: Boolean(
          user.id === userID && socket.connected && socket.rooms.has(roomID) && room && !room.nextRoomID,
        ),
        seated: Boolean(room?.players.includes(userID)),
        admin: profile.isAdmin === true,
        leader: room?.leaderID === userID,
      };
    },
    remove: async (room, id) => {
      try {
        await client?.removeParticipant(room, id);
      } catch (error) {
        if ((error as { code?: string }).code !== 'not_found') throw error;
      }
    },
    deleteRoom: async (room) => {
      try {
        await client?.deleteRoom(room);
      } catch (error) {
        if ((error as { code?: string }).code !== 'not_found') throw error;
      }
    },
    stateChanged: (id) => manager.io.to(id).emit('voiceStateChanged', id),
    revoked: (socketID, id) => manager.io.to(socketID).emit('voiceRevoked', id),
  });
  if (config) {
    const refreshStartup = async () => {
      const wasReady = startup?.ready;
      await startup?.reconcile();
      if (!wasReady && startup?.ready) {
        for (const id of Object.keys(manager.rooms)) manager.io.to(id).emit('voiceStateChanged', id);
      }
    };
    void refreshStartup();
    const timer = setInterval(() => {
      void refreshStartup();
      void service.reconcile();
    }, 5000);
    timer.unref();
  }
  return service;
}
export function startVoiceGateway(service: VoiceService) {
  if (!service.config) return;
  const server = createVoiceGateway(service.config.internalUrl, service);
  server.listen(service.config.gatewayPort, service.config.gatewayHost);
  server.on('error', () => {
    console.error('Voice gateway failed to listen');
    process.exitCode = 1;
  });
  return server;
}
const codes = new Set(['unavailable', 'forbidden', 'rateLimited', 'invalidRequest']);
export function registerVoiceEndpoints(service: VoiceService, socket: ServerSocket, userID?: string) {
  const execute = async <T>(key: unknown, cb: unknown, action: () => Promise<T> | T) => {
    if (typeof cb !== 'function') return;
    try {
      if (typeof key !== 'string' || !key.length || key.length > 100) throw Error('invalidRequest');
      service.limit(`socket:${socket.id}`, 60);
      if (!userID) throw Error('forbidden');
      service.limit(`account:${userID}`, 60);
      cb(await action());
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      cb({ error: codes.has(message) ? message : 'unavailable' } as VoiceError);
    }
  };
  socket.on('getVoiceState', (id, cb) => void execute(id, cb, () => service.state(userID!, socket.id, id)));
  socket.on(
    'setVoiceEnabled',
    (id, enabled, cb) => void execute(id, cb, () => service.setEnabled(userID!, socket.id, id, enabled)),
  );
  socket.on('joinVoice', (id, cb) => void execute(id, cb, () => service.join(userID!, socket.id, id)));
  socket.on('leaveVoice', (id, cb) => void execute(id, cb, () => service.leave(userID!, socket.id, id)));
  socket.on('disconnecting', () => service.revokeSocket(socket.id));
}
