/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiService } from './service';
import { BotRoom } from './room';
import type { Manager } from '@/main';
import type { Server, ServerSocket } from '@avalon/types';
import type { AiRepository } from './repository';

test('only allowlisted authenticated account can create or control a room, duplicate create returns same room', async () => {
  const old = process.env.AI_ROOM_ADMIN_LOGINS;
  process.env.AI_ROOM_ADMIN_LOGINS = 'razdva';
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const host = {
    rooms: {},
    io,
    updateRoomsList: () => {},
    dbManager: {
      getUserProfile: async (id: string) => ({ login: id === 'owner' ? 'razdva' : 'visitor' }),
    },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = {
    claim: async () => {},
    release: async () => {},
    save: async () => {},
  } as unknown as AiRepository;
  // Socket transport is the boundary; callbacks run the actual authorization and room creation.
  function connect(id?: string) {
    const events: Record<string, (...args: any[]) => Promise<void>> = {};
    service.register(
      {
        on: (name: string, handler: (...args: any[]) => Promise<void>) => {
          events[name] = handler;
        },
      } as unknown as ServerSocket,
      id,
    );
    return events;
  }
  try {
    for (const id of [undefined, 'visitor']) {
      const response = jest.fn();
      await connect(id).createAiRoom(response);
      expect(response.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
      expect(Object.keys(host.rooms)).toHaveLength(0);
    }
    const admin = connect('owner');
    const created = jest.fn();
    await admin.createAiRoom(created);
    const id = created.mock.calls[0][0].roomID;
    expect(host.rooms[id]).toBeInstanceOf(BotRoom);
    await admin.createAiRoom(created);
    expect(created.mock.calls[1][0]).toEqual({ roomID: id });
    expect(Object.keys(host.rooms)).toHaveLength(1);
    const denied = jest.fn();
    await connect('visitor').controlAiRoom(id, 'start', denied);
    expect(denied.mock.calls[0][0]).toEqual({ error: 'AI room access denied' });
    expect(host.rooms[id].ai?.status).toBe('ready');
    await admin.controlAiRoom(id, 'stop', jest.fn());
    expect(host.rooms[id].ai?.status).toBe('stopped');
  } finally {
    if (old === undefined) delete process.env.AI_ROOM_ADMIN_LOGINS;
    else process.env.AI_ROOM_ADMIN_LOGINS = old;
  }
});
