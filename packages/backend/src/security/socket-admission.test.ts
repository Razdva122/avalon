import { clientAddress, installSocketAdmission } from './socket-admission';
import type { IncomingMessage } from 'http';
import type { Server } from '@avalon/types';

function request(ip: string, forwarded?: string) {
  return {
    socket: { remoteAddress: ip },
    headers: forwarded ? { 'x-forwarded-for': forwarded } : {},
  } as IncomingMessage;
}
test('only configured proxies can supply the client IP for limits', () => {
  expect(clientAddress(request('198.51.100.2', '203.0.113.1'), '')).toBe('198.51.100.2');
  expect(clientAddress(request('127.0.0.1', '203.0.113.1'), 'loopback')).toBe('203.0.113.1');
  expect(clientAddress(request('198.51.100.2', '203.0.113.1'), 'loopback')).toBe('198.51.100.2');
});
type PacketHandler = (data: unknown[], next: (error?: Error) => void) => void;
type TestSocket = {
  request: IncomingMessage;
  data: Record<string, unknown>;
  use(fn: PacketHandler): void;
  on(): void;
  emit(): void;
  listenerCount(): number;
};
function setup() {
  let handshake!: (socket: TestSocket, next: (error?: Error) => void) => void;
  let connect!: (socket: TestSocket) => void;
  installSocketAdmission({
    use: (fn: typeof handshake) => {
      handshake = fn;
    },
    on: (_: string, fn: typeof connect) => {
      connect = fn;
    },
  } as unknown as Server);
  return (ip: string) => {
    let packet!: (data: unknown[], next: (error?: Error) => void) => void;
    const socket = {
      request: request(ip),
      data: {},
      use: (fn: typeof packet) => {
        packet = fn;
      },
      on() {},
      emit() {},
      listenerCount: () => 1,
    };
    handshake(socket, (error) => {
      if (error) throw error;
    });
    connect(socket);
    return (event: string, ...args: unknown[]) => {
      let result: Error | undefined;
      packet([event, ...args], (error) => {
        result = error;
      });
      return result?.message;
    };
  };
}
test('account login budget survives reconnects and source-IP rotation', () => {
  const connection = setup();
  for (let i = 0; i < 10; i++)
    expect(connection(`198.51.100.${i + 1}`)('login', ' Alice ', 'password', () => {})).toBeUndefined();
  expect(connection('203.0.113.1')('login', 'alice', 'password', () => {})).toBe('rateLimited');
});
test('a rejected registration replies to ack and never reaches the next handler', () => {
  const connection = setup();
  const packet = connection('198.51.100.1');
  for (let i = 0; i < 5; i++) expect(packet('registerUser', {}, () => {})).toBeUndefined();
  const reply = jest.fn();
  expect(packet('registerUser', {}, reply)).toBe('rateLimited');
  expect(reply).toHaveBeenCalledWith({ error: 'rateLimited' });
});

test.each(['development', 'production', 'test', undefined])(
  'registration budget supports local test accounts without weakening %s limits',
  (environment) => {
    const previous = process.env.NODE_ENV;
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
    try {
      const connection = setup();
      for (let i = 0; i < 5; i++) expect(connection('198.51.100.1')('registerUser', {}, () => {})).toBeUndefined();
      const packet = connection('198.51.100.1');
      if (environment === 'development') {
        for (let i = 5; i < 100; i++) expect(packet('registerUser', {}, () => {})).toBeUndefined();
      }
      expect(packet('registerUser', {}, () => {})).toBe('rateLimited');
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  },
);
