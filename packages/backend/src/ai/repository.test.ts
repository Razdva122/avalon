import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoClient } from 'mongodb';
import { AiRepository } from './repository';
let server: MongoMemoryServer;
let client: MongoClient;
beforeAll(async () => {
  server = await MongoMemoryServer.create();
  client = await MongoClient.connect(server.getUri());
});
afterAll(async () => {
  await client?.close();
  await server?.stop();
});
test('atomic reservations cannot exceed the shared budget and survive a new repository instance', async () => {
  const db = client.db('budget');
  const repo = new AiRepository(db, 1, 1);
  await repo.claim('match');
  const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => repo.reserve('match', 2000)));
  expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(5);
  expect(await new AiRepository(db, 1, 1).roomCost('match')).toBe(1);
  await expect(repo.reserve('match', 1)).rejects.toThrow();
  await repo.settle('match', 2000, 500);
  expect(await repo.roomCost('match')).toBe(0.85);
  await expect(repo.claim('other-match')).rejects.toThrow();
});
test('per-room cap and missing lease reject requests before charging', async () => {
  const repo = new AiRepository(client.db('perroom'), 2, 0.5);
  await repo.claim('room');
  await repo.reserve('room', 5000);
  await expect(repo.reserve('room', 1)).rejects.toThrow();
  await expect(repo.reserve('not-owner', 100)).rejects.toThrow();
  expect(await repo.roomCost('room')).toBe(0.5);
});

test('recent AI replays survive a repository restart and are returned newest first with a limit', async () => {
  const db = client.db('replays');
  await db.collection<{ _id: string; state: Record<string, unknown> }>('ai_room_replays').insertMany([
    { _id: 'old', state: { roomID: 'old', createAt: '2026-09-20T12:00:00.000Z', ai: { status: 'finished' } } },
    { _id: 'new', state: { roomID: 'new', createAt: '2026-09-21T12:00:00.000Z', ai: { status: 'paused' } } },
  ]);
  const rooms = await new AiRepository(db).recent(1);
  expect(rooms.map((r) => r.roomID)).toEqual(['new']);
  expect(rooms[0].ai?.status).toBe('stopped');
});
