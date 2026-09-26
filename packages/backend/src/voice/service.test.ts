import { VoiceService, VoicePolicy } from './service';
import { TokenVerifier, AccessToken, TrackSource } from 'livekit-server-sdk';

const config = {
  apiKey: 'test-key',
  apiSecret: 'a'.repeat(40),
  internalUrl: 'http://127.0.0.1:7880',
  publicUrl: 'wss://voice.example',
  gatewayHost: '127.0.0.1',
  gatewayPort: 7882,
};
function setup() {
  const policies = new Map<string, VoicePolicy>();
  policies.set('alice', { present: true, seated: true, admin: false, leader: true });
  policies.set('bob', { present: true, seated: true, admin: false, leader: false });
  policies.set('admin', { present: true, seated: false, admin: true, leader: false });
  policies.set('viewer', { present: true, seated: false, admin: false, leader: false });
  const removed: string[] = [];
  const service = new VoiceService(config, {
    policy: async (userID) => policies.get(userID) || { present: false, seated: false, admin: false, leader: false },
    exists: (id) => id === 'room',
    remove: async (_room, id) => {
      removed.push(id);
    },
    deleteRoom: async () => {},
    stateChanged: () => {},
    revoked: () => {},
  });
  return { service, policies, removed };
}
test('only seated players and site administrators receive microphone-only tokens', async () => {
  const { service, policies } = setup();
  await service.setEnabled('alice', 'socket', 'room', true);
  await expect(service.join('viewer', 'socket-v', 'room')).rejects.toThrow('forbidden');
  policies.set('viewer', { present: true, seated: false, admin: false, leader: true });
  await expect(service.join('viewer', 'socket-v', 'room')).rejects.toThrow('forbidden');
  for (const user of ['alice', 'admin']) {
    const result = await service.join(user, `socket-${user}`, 'room');
    const claims = await new TokenVerifier(config.apiKey, config.apiSecret).verify(result.token);
    expect(claims.video).toMatchObject({
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: ['microphone'],
      canPublishData: false,
    });
    expect(claims.video?.roomAdmin).not.toBe(true);
    expect(await service.admit(result.token)).toBe(result.sessionID);
  }
});
test('disabled rooms, guests and different rooms cannot join', async () => {
  const { service } = setup();
  await expect(service.join('alice', 's', 'room')).rejects.toThrow('unavailable');
  await service.setEnabled('alice', 's', 'room', true);
  await expect(service.join('guest', 'g', 'room')).rejects.toThrow('forbidden');
  await expect(service.join('alice', 's', 'other')).rejects.toThrow();
});
test('revocation rejects original and SDK-refreshed tokens before media removal completes', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const joined = await service.join('alice', 's', 'room');
  const original = await new TokenVerifier(config.apiKey, config.apiSecret).verify(joined.token);
  const refreshed = new AccessToken(config.apiKey, config.apiSecret, { identity: joined.sessionID, ttl: '6h' });
  refreshed.addGrant({ ...original.video!, canPublishSources: [TrackSource.MICROPHONE] });
  service.revokeSocket('s');
  await expect(service.admit(joined.token)).rejects.toThrow('forbidden');
  await expect(service.admit(await refreshed.toJwt())).rejects.toThrow('forbidden');
});
test('losing seat or administrator role blocks admission even before reconciliation', async () => {
  const { service, policies } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  for (const user of ['bob', 'admin']) {
    const joined = await service.join(user, user, 'room');
    policies.set(user, { present: true, seated: false, admin: false, leader: false });
    await expect(service.admit(joined.token)).rejects.toThrow('forbidden');
  }
});
test('replacement and room disable invalidate previous admission', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const first = await service.join('alice', 's', 'room');
  const second = await service.join('alice', 's2', 'room');
  await expect(service.admit(first.token)).rejects.toThrow('forbidden');
  expect(await service.admit(second.token)).toBe(second.sessionID);
  await service.setEnabled('alice', 's2', 'room', false);
  await expect(service.admit(second.token)).rejects.toThrow('forbidden');
});
test('local leave cannot revoke another account session', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const joined = await service.join('alice', 's', 'room');
  expect(() => service.leave('bob', 'b', joined.sessionID)).toThrow('forbidden');
  expect(await service.admit(joined.token)).toBe(joined.sessionID);
});
test('a pending join is rejected when its socket leaves before token signing finishes', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const pending = service.join('alice', 's', 'room');
  service.revokeSocket('s');
  await expect(pending).rejects.toThrow('forbidden');
});
test('policy failures revoke existing connections and retire the admission', async () => {
  const { service, policies } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const joined = await service.join('alice', 's', 'room');
  let closed = false;
  service.attach(joined.sessionID, () => {
    closed = true;
  });
  policies.delete('alice');
  await service.reconcile();
  expect(closed).toBe(true);
  await expect(service.admit(joined.token)).rejects.toThrow('forbidden');
});
test('join limits prevent unbounded token issuance', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  for (let i = 0; i < 12; i++) await service.join('alice', 's', 'room');
  await expect(service.join('alice', 's', 'room')).rejects.toThrow('rateLimited');
});
test('tokens for another room and forged tokens cannot pass the gateway admission', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const joined = await service.join('alice', 's', 'room');
  const wrongRoom = new AccessToken(config.apiKey, config.apiSecret, { identity: joined.sessionID });
  wrongRoom.addGrant({ roomJoin: true, room: 'different' });
  await expect(service.admit(await wrongRoom.toJwt())).rejects.toThrow('forbidden');
  await expect(service.admit(joined.token.slice(0, -12) + 'tampered')).rejects.toThrow();
});
test('failed participant removal quarantines the room and marks control unhealthy', async () => {
  let fail = true;
  const service = new VoiceService(config, {
    exists: () => true,
    policy: async () => ({ present: true, seated: true, admin: false, leader: true }),
    remove: async () => {
      throw Error('offline');
    },
    deleteRoom: async () => {
      if (fail) throw Error('offline');
    },
    stateChanged: () => {},
    revoked: () => {},
  });
  await service.setEnabled('alice', 's', 'room', true);
  const joined = await service.join('alice', 's', 'room');
  service.revokeSocket('s');
  await new Promise((resolve) => setImmediate(resolve));
  expect(service.healthy()).toBe(false);
  expect((await service.state('alice', 's', 'room')).available).toBe(false);
  await expect(service.admit(joined.token)).rejects.toThrow('forbidden');
  fail = false;
  await service.reconcile();
  expect(service.healthy()).toBe(true);
  expect((await service.state('alice', 's', 'room')).enabled).toBe(false);
});
test('different accounts can join simultaneously without invalidating each other', async () => {
  const { service } = setup();
  await service.setEnabled('alice', 's', 'room', true);
  const results = await Promise.all([service.join('alice', 'a', 'room'), service.join('bob', 'b', 'room')]);
  for (const result of results) expect(await service.admit(result.token)).toBe(result.sessionID);
});
test('startup cleanup readiness blocks admissions and health until old media rooms are retired', async () => {
  let ready = false;
  const service = new VoiceService(config, {
    ready: () => ready,
    exists: () => true,
    policy: async () => ({ present: true, seated: true, admin: false, leader: true }),
    remove: async () => {},
    deleteRoom: async () => {},
    stateChanged: () => {},
    revoked: () => {},
  });
  expect(service.healthy()).toBe(false);
  expect((await service.state('alice', 's', 'room')).available).toBe(false);
  await expect(service.setEnabled('alice', 's', 'room', true)).rejects.toThrow('unavailable');
  ready = true;
  expect(service.healthy()).toBe(true);
  await service.setEnabled('alice', 's', 'room', true);
  expect((await service.join('alice', 's', 'room')).sessionID).toBeTruthy();
});
