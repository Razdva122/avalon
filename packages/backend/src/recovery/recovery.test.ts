import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoRecoveryRepository } from './repository';
import { RecoveryService } from './service';
import { MailConfig, mailConfig } from './config';
import { decrypt } from './crypto';
import express from 'express';
import { AddressInfo } from 'net';
import { createRecoveryRouter } from './routes';

jest.setTimeout(120000);
let mongo: MongoMemoryServer;
let repository: MongoRecoveryRepository;
let service: RecoveryService;
let now: number;
let sent: { to: string; subject: string; text: string }[];
const config: MailConfig = {
  user: 'test-key',
  password: 'test-secret',
  from: 'security@example.com',
  origin: 'https://example.com',
  key: Buffer.alloc(32, 1),
  eventSecret: 'a'.repeat(64),
  production: false,
  allowedRecipients: ['player@example.com'],
  hourlyLimit: 100,
  dailyLimit: 1000,
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  repository = new MongoRecoveryRepository(mongoose.connection.db!, 'users');
  await repository.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
  await repository.init();
  now = Date.parse('2026-09-18T10:00:00Z');
  sent = [];
  service = new RecoveryService(
    repository,
    config,
    async (mail) => {
      sent.push(mail);
    },
    () => new Date(now),
  );
  await repository.users.insertOne({
    id: 'player',
    email: 'player@example.com',
    password: await bcrypt.hash('old-password', 4),
  });
});

async function requestToken(ip = '192.0.2.1') {
  await service.request(' PLAYER@example.com ', ip, 'ru');
  const user = await repository.users.findOne({ id: 'player' });
  const job = user!.mailQueue![user!.mailQueue!.length - 1];
  return JSON.parse(decrypt(job.payload, config.key)).token as string;
}

test('request keeps only a digest outside the encrypted outbox and sends the saved address', async () => {
  const token = await requestToken();
  const user = await repository.users.findOne({ id: 'player' });
  expect(JSON.stringify(user)).not.toContain(token);
  expect(user!.recoveryTokens![0].hash).toMatch(/^[a-f0-9]{64}$/);
  expect(await service.deliverOne()).toBe(true);
  expect(sent).toHaveLength(1);
  expect(sent[0].to).toBe('player@example.com');
  expect(sent[0].text).toContain(`https://example.com/password-recovery/#${token}`);
  expect((await repository.users.findOne({ id: 'player' }))!.mailQueue).toHaveLength(0);
});

test('unknown accounts never generate mail', async () => {
  await expect(service.request('missing@example.com', '192.0.2.1', 'en')).resolves.toBeUndefined();
  expect(await service.deliverOne()).toBe(false);
  expect(sent).toHaveLength(0);
});

test('concurrent requests across service instances enqueue only one message', async () => {
  await Promise.all(Array.from({ length: 15 }, (_, i) => service.request('player@example.com', `192.0.2.${i}`, 'en')));
  expect((await repository.users.findOne({ id: 'player' }))!.mailQueue).toHaveLength(1);
});

test('rolling hourly and daily limits apply across different IPs', async () => {
  for (let i = 0; i < 4; i++) {
    await service.request('player@example.com', `192.0.2.${i}`, 'en');
    now += 121000;
  }
  expect((await repository.users.findOne({ id: 'player' }))!.mailQueue).toHaveLength(3);
  now += 3600000;
  for (let i = 0; i < 3; i++) {
    await service.request('player@example.com', `192.0.3.${i}`, 'en');
    now += 121000;
  }
  expect((await repository.users.findOne({ id: 'player' }))!.mailQueue).toHaveLength(5);
});

test('only one concurrent reset wins and all sibling tokens are revoked', async () => {
  const first = await requestToken();
  now += 121000;
  const second = await requestToken();
  const results = await Promise.allSettled([
    service.reset(first, 'new-password-one', '192.0.2.2'),
    service.reset(first, 'new-password-two', '192.0.2.3'),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  await expect(service.reset(second, 'third-password', '192.0.2.4')).rejects.toThrow('invalid_token');
  const user = await repository.users.findOne({ id: 'player' });
  expect(await bcrypt.compare('old-password', user!.password)).toBe(false);
  expect(user!.authVersion).toBe(1);
  expect(user!.recoveryTokens).toEqual([]);
  while (await service.deliverOne()) {
    /* drain */
  }
  expect(sent).toHaveLength(1);
  expect(sent[0].text).not.toContain(first);
});

test('expired tokens and tokens for a changed email cannot reset a password', async () => {
  const token = await requestToken();
  now += 30 * 60000;
  await expect(service.reset(token, 'new-password', '192.0.2.2')).rejects.toThrow('invalid_token');
  now -= 60000;
  await repository.users.updateOne({ id: 'player' }, { $set: { email: 'new@example.com' } });
  await expect(service.reset(token, 'new-password', '192.0.2.2')).rejects.toThrow('invalid_token');
});

test('non-production recipient allowlist and suppression prevent sending', async () => {
  await requestToken();
  await repository.suppress(service.addressKey('player@example.com'), 'complaint', new Date(now));
  expect(await service.deliverOne()).toBe(true);
  expect(sent).toHaveLength(0);
  await repository.users.insertOne({ id: 'other', email: 'other@example.com', password: 'hash' });
  await service.request('other@example.com', '192.0.2.5', 'en');
  expect(await service.deliverOne()).toBe(false);
});

test('explicit temporary SMTP failures retry with delay; successful jobs are never sent twice', async () => {
  let calls = 0;
  service = new RecoveryService(
    repository,
    config,
    async (mail) => {
      if (++calls === 1) throw Object.assign(new Error('temporary'), { responseCode: 451 });
      sent.push(mail);
    },
    () => new Date(now),
  );
  await requestToken();
  await service.deliverOne();
  expect(await service.deliverOne()).toBe(false);
  now += 61000;
  await service.deliverOne();
  expect(sent).toHaveLength(1);
  expect(await service.deliverOne()).toBe(false);
});

test('ambiguous network failures are not automatically retried', async () => {
  service = new RecoveryService(
    repository,
    config,
    async () => {
      throw new Error('timeout');
    },
    () => new Date(now),
  );
  await requestToken();
  await service.deliverOne();
  now += 600000;
  expect(await service.deliverOne()).toBe(false);
});

test('bcrypt byte limit and weak passwords do not consume the token', async () => {
  const token = await requestToken();
  await expect(service.reset(token, 'short', '192.0.2.2')).rejects.toThrow('invalid_password');
  await expect(service.reset(token, 'я'.repeat(37), '192.0.2.2')).rejects.toThrow('invalid_password');
  await expect(service.reset(token, 'valid-password', '192.0.2.2')).resolves.toBe('player');
});

test('mail remains disabled by default and incomplete opt-in fails closed', () => {
  expect(mailConfig({})).toBeNull();
  expect(() => mailConfig({ MAIL_ENABLED: 'true' })).toThrow();
});

async function withHTTP(run: (url: string) => Promise<void>, enabled = true) {
  const app = express();
  app.use('/api/auth', createRecoveryRouter(enabled ? service : null));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/auth`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
const json = (body: unknown, authorization?: string) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(authorization ? { authorization } : {}) },
  body: JSON.stringify(body),
});

test('HTTP request responses do not reveal existing, missing or throttled addresses', async () => {
  await withHTTP(async (url) => {
    for (const email of ['player@example.com', 'missing@example.com', 'player@example.com']) {
      const response = await fetch(`${url}/forgot-password`, json({ email }));
      expect(response.status).toBe(202);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ ok: true });
    }
  });
});

test('disabled recovery reports unavailable without queuing any email', async () => {
  await withHTTP(async (url) => {
    expect(await (await fetch(`${url}/recovery`)).json()).toEqual({ enabled: false });
    expect((await fetch(`${url}/forgot-password`, json({ email: 'player@example.com' }))).status).toBe(503);
  }, false);
  expect(await service.deliverOne()).toBe(false);
});

test('only an authenticated permanent bounce or complaint suppresses an address', async () => {
  const event = {
    eventType: 'Bounce',
    bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: 'player@example.com' }] },
  };
  await withHTTP(async (url) => {
    expect((await fetch(`${url}/mail-events`, json(event))).status).toBe(401);
    expect(await repository.suppressed(service.addressKey('player@example.com'))).toBe(false);
    const auth = `Bearer ${config.eventSecret}`;
    expect(
      (
        await fetch(
          `${url}/mail-events`,
          json({ ...event, bounce: { ...event.bounce, bounceType: 'Transient' } }, auth),
        )
      ).status,
    ).toBe(200);
    expect(await repository.suppressed(service.addressKey('player@example.com'))).toBe(false);
    expect((await fetch(`${url}/mail-events`, json(event, auth))).status).toBe(200);
    expect(await repository.suppressed(service.addressKey('player@example.com'))).toBe(true);
  });
});

test('GET cannot consume a token; POST succeeds once and rejects reuse', async () => {
  const token = await requestToken();
  await withHTTP(async (url) => {
    expect((await fetch(`${url}/reset-password?token=${token}`)).status).toBe(404);
    const body = { token, password: 'new-password' };
    expect((await fetch(`${url}/reset-password`, json(body))).status).toBe(200);
    const reused = await fetch(`${url}/reset-password`, json(body));
    expect(reused.status).toBe(400);
    expect(await reused.json()).toEqual({ error: 'invalid_token' });
  });
});

test('IP limit does not accept a forged forwarding header', async () => {
  await withHTTP(async (url) => {
    for (let i = 0; i < 10; i++) {
      expect((await fetch(`${url}/reset-password`, json({ token: 'bad', password: 'new-password' }))).status).toBe(400);
    }
    const request = json({ token: 'bad', password: 'new-password' });
    const response = await fetch(`${url}/reset-password`, {
      ...request,
      headers: { ...request.headers, 'X-Forwarded-For': '192.0.2.99' },
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
  });
});

test('two workers cannot claim the same job and expired jobs cannot be sent', async () => {
  await requestToken();
  await Promise.all([service.deliverOne(), service.deliverOne()]);
  expect(sent).toHaveLength(1);
  now += 121000;
  await requestToken();
  now += 1800000;
  expect(await service.deliverOne()).toBe(false);
  await repository.cleanup(new Date(now));
  const user = await repository.users.findOne({ id: 'player' });
  expect(user!.mailQueue).toEqual([]);
  expect(user!.recoveryTokens).toEqual([]);
});

test('global send cap queues mail without sending beyond its limit', async () => {
  service = new RecoveryService(
    repository,
    { ...config, hourlyLimit: 1 },
    async (mail) => {
      sent.push(mail);
    },
    () => new Date(now),
  );
  await requestToken();
  await service.deliverOne();
  now += 121000;
  await requestToken();
  await service.deliverOne();
  expect(sent).toHaveLength(1);
  expect((await repository.users.findOne({ id: 'player' }))!.mailQueue).toHaveLength(1);
});

test('quota deferrals do not consume the retry budget for temporary SMTP failures', async () => {
  let calls = 0;
  service = new RecoveryService(
    repository,
    { ...config, hourlyLimit: 1 },
    async (mail) => {
      if (++calls === 1) throw Object.assign(new Error('temporary'), { responseCode: 451 });
      sent.push(mail);
    },
    () => new Date(now),
  );
  await repository.take('global-send', [{ count: 1, ms: 3600000 }], new Date(now - 50 * 60000));
  await requestToken();
  await service.deliverOne();
  now += 5 * 60000;
  await service.deliverOne();
  now += 5 * 60000;
  await service.deliverOne();
  const queue = (await repository.users.findOne({ id: 'player' }))!.mailQueue!;
  expect(queue).toHaveLength(1);
  expect(queue[0].attempts).toBe(1);
  expect(queue[0].state).toBe('pending');
});
