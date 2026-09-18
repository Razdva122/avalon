import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { authenticatedUser, installSessionChecks } from './sessions';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import type { Server as AvalonServer } from '@avalon/types';
const accounts = new Map<string, number>([['player', 0]]);
jest.mock('@/db/models', () => ({
  userProfileModel: {
    exists: async (filter: { id: string; $expr: { $eq: [unknown, number] } }) =>
      accounts.get(filter.id) === filter.$expr.$eq[1] ? { _id: 'exists' } : null,
  },
}));
beforeAll(() => {
  config.SECRET_KEY = 'test-session-key';
});
beforeEach(() => {
  accounts.set('player', 0);
});
test('legacy tokens remain usable until the account version changes', async () => {
  const token = jwt.sign({ id: 'player' }, config.SECRET_KEY, { expiresIn: '1h' });
  expect((await authenticatedUser(token)).id).toBe('player');
  accounts.set('player', 1);
  await expect(authenticatedUser(token)).rejects.toThrow('revoked_session');
});
test('new token version must match the database and deleted users are rejected', async () => {
  accounts.set('player', 2);
  const token = jwt.sign({ id: 'player', authVersion: 2 }, config.SECRET_KEY, { expiresIn: '1h' });
  expect((await authenticatedUser(token)).id).toBe('player');
  accounts.delete('player');
  await expect(authenticatedUser(token)).rejects.toThrow('revoked_session');
});

test('a connected socket cannot execute an event after its session is revoked', async () => {
  const server = createServer();
  const io = new Server(server);
  installSessionChecks(io as AvalonServer);
  let calls = 0;
  io.on('connection', (socket) => {
    socket.on('protected-action', (ack: () => void) => {
      calls++;
      ack();
    });
  });
  server.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const token = jwt.sign({ id: 'player', authVersion: 0 }, config.SECRET_KEY, { expiresIn: '1h' });
  const client = connect(`http://127.0.0.1:${(server.address() as AddressInfo).port}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
  try {
    await new Promise<void>((resolve) => client.once('connect', resolve));
    await client.timeout(2000).emitWithAck('protected-action');
    expect(calls).toBe(1);
    accounts.set('player', 1);
    const disconnected = new Promise<void>((resolve) => client.once('disconnect', () => resolve()));
    client.emit('protected-action', () => {});
    await disconnected;
    expect(calls).toBe(1);
  } finally {
    client.disconnect();
    await new Promise<void>((resolve) => io.close(() => resolve()));
  }
});
