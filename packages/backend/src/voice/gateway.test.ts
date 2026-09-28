import { createServer } from 'node:http';
import { once, EventEmitter } from 'node:events';
import { AddressInfo } from 'node:net';
import WebSocket, { WebSocketServer } from 'ws';
import { createVoiceGateway } from './gateway';
import { VoiceService } from './service';

test('gateway denies unknown paths and stale admissions, forwards valid WebSocket and closes on revocation', async () => {
  const upstream = createServer((_req, res) => res.end('success'));
  const wss = new WebSocketServer({ server: upstream });
  wss.on('connection', (socket) => socket.on('message', (data) => socket.send(data)));
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  let allowed = true;
  let closeAdmission: () => void = () => {};
  const gateway = createVoiceGateway(`http://127.0.0.1:${(upstream.address() as AddressInfo).port}`, {
    admit: async (token) => {
      if (!allowed || token !== 'valid') throw Error('forbidden');
      return 'session';
    },
    attach: (_id, close) => {
      closeAdmission = close;
      return () => {};
    },
    limit: () => {},
  });
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const origin = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
  try {
    expect((await fetch(`${origin}/twirp/livekit.RoomService/ListRooms`)).status).toBe(404);
    expect((await fetch(`${origin}/rtc/validate?access_token=bad`)).status).toBe(403);
    expect((await fetch(`${origin}/rtc/validate?access_token=valid`)).status).toBe(200);
    expect((await fetch(`${origin}/rtc/validate?access_token=valid&publish=foo`)).status).toBe(403);
    const ws = new WebSocket(`${origin.replace('http:', 'ws:')}/rtc?access_token=valid`);
    await once(ws, 'open');
    ws.send('hello');
    expect(String((await once(ws, 'message'))[0])).toBe('hello');
    const closed = once(ws, 'close');
    allowed = false;
    closeAdmission();
    await closed;
    expect((await fetch(`${origin}/rtc/validate?access_token=valid`)).status).toBe(403);
  } finally {
    wss.clients.forEach((socket) => socket.terminate());
    await new Promise<void>((resolve) => gateway.close(() => resolve()));
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  }
});
test('initial upstream messages arrive even when sent immediately at handshake', async () => {
  const upstream = createServer();
  const wss = new WebSocketServer({ server: upstream });
  wss.on('connection', (socket) => socket.send('join-response'));
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  let revoke = () => {};
  const gateway = createVoiceGateway(`http://127.0.0.1:${(upstream.address() as AddressInfo).port}`, {
    healthy: () => true,
    admit: async () => 'session',
    attach: (_id, close) => {
      revoke = close;
      return () => {};
    },
    limit: () => {},
  });
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const origin = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
  const client = new WebSocket(`${origin.replace('http:', 'ws:')}/rtc?access_token=valid`);
  try {
    const message = await once(client, 'message');
    expect(String(message[0])).toBe('join-response');
    expect((await fetch(`${origin}/health/voice`)).status).toBe(204);
  } finally {
    const closed = once(client, 'close');
    revoke();
    await closed;
    wss.clients.forEach((socket) => socket.terminate());
    await new Promise<void>((resolve) => gateway.close(() => resolve()));
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  }
});

test('participant count broadcasts only established conversations and updates when the socket closes', async () => {
  const upstream = createServer((_req, res) => res.end('success'));
  const wss = new WebSocketServer({ server: upstream });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const internalUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
  const changes = new EventEmitter();
  const service = new VoiceService(
    {
      apiKey: 'test',
      apiSecret: 'a'.repeat(40),
      internalUrl,
      publicUrl: 'wss://voice.example',
      gatewayHost: '127.0.0.1',
      gatewayPort: 7882,
    },
    {
      exists: () => true,
      policy: async () => ({ present: true, seated: true, admin: false, leader: false }),
      remove: async () => {},
      deleteRoom: async () => {},
      stateChanged: (roomID) => changes.emit('changed', roomID),
      revoked: () => {},
    },
  );
  const admission = await service.join('alice', 'a', 'room');
  const gateway = createVoiceGateway(internalUrl, service);
  gateway.listen(0, '127.0.0.1');
  await once(gateway, 'listening');
  const origin = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
  let client: WebSocket | undefined;
  try {
    expect((await fetch(`${origin}/rtc/validate?access_token=${admission.token}`)).status).toBe(200);
    expect((await service.state('bob', 'b', 'room')).participantCount).toBe(0);
    const entered = once(changes, 'changed');
    client = new WebSocket(`${origin.replace('http:', 'ws:')}/rtc?access_token=${admission.token}`);
    await once(client, 'open');
    expect(await entered).toEqual(['room']);
    expect((await service.state('bob', 'b', 'room')).participantCount).toBe(1);
    expect((await service.state('bob', 'b', 'another-room')).participantCount).toBe(0);
    const left = once(changes, 'changed');
    const closed = once(client, 'close');
    client.close();
    await closed;
    expect(await left).toEqual(['room']);
    expect((await service.state('bob', 'b', 'room')).participantCount).toBe(0);
  } finally {
    client?.terminate();
    wss.clients.forEach((socket) => socket.terminate());
    await new Promise<void>((resolve) => gateway.close(() => resolve()));
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  }
});
