import { once } from 'node:events';
import { AddressInfo } from 'node:net';
import { VoiceStartup } from './startup';
import { VoiceService } from './service';
import { createVoiceGateway } from './gateway';

test('private recovery closes admissions and old connections until media cleanup succeeds', async () => {
  let online = true;
  const mediaRooms = new Set(['old-room']);
  const startup = new VoiceStartup({
    listRooms: async () => {
      if (!online) throw Error('offline');
      return [...mediaRooms].map((name) => ({ name }));
    },
    deleteRoom: async (name) => {
      mediaRooms.delete(name);
    },
  });
  await startup.reconcile();
  const service = new VoiceService(
    {
      apiKey: 'test',
      apiSecret: 'a'.repeat(40),
      internalUrl: 'http://127.0.0.1:1',
      publicUrl: 'wss://voice.example',
      gatewayHost: '127.0.0.1',
      gatewayPort: 7882,
    },
    {
      ready: () => startup.ready,
      prepareRecovery: () => startup.reset(),
      exists: () => true,
      policy: async () => ({ present: true, seated: true, admin: false, leader: true }),
      remove: async () => {},
      deleteRoom: async () => {},
      stateChanged: () => {},
      revoked: () => {},
    },
  );
  const gateway = createVoiceGateway(service.config!.internalUrl, service);
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const origin = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
  try {
    await service.setEnabled('alice', 's', 'room', true);
    const old = await service.join('alice', 's', 'room');
    let closed = false;
    service.attach(old.sessionID, () => {
      closed = true;
    });
    online = false;
    expect((await fetch(`${origin}/recovery/voice`, { method: 'POST' })).status).toBe(204);
    expect(closed).toBe(true);
    expect((await fetch(`${origin}/health/voice`)).status).toBe(503);
    expect((await service.state('alice', 's', 'room')).available).toBe(false);
    await expect(service.join('alice', 's', 'room')).rejects.toThrow('unavailable');
    await startup.reconcile();
    expect(service.healthy()).toBe(false);
    mediaRooms.add('stale-room-after-restart');
    online = true;
    await startup.reconcile();
    await service.reconcile();
    expect(mediaRooms.size).toBe(0);
    expect((await fetch(`${origin}/health/voice`)).status).toBe(204);
    await expect(service.admit(old.token)).rejects.toThrow('forbidden');
    const joined = await service.join('alice', 's', 'room');
    expect(await service.admit(joined.token)).toBe(joined.sessionID);
    expect((await fetch(`${origin}/recovery/voice`)).status).toBe(404);
    expect((await fetch(`${origin}/recovery/voice?extra=1`, { method: 'POST' })).status).toBe(404);
  } finally {
    await new Promise<void>((resolve) => gateway.close(() => resolve()));
  }
});
