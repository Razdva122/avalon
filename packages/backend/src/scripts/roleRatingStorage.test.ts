import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { publishRoleRatings, readRoleRatings, readRoleHistory, ensureRoleRatingIndexes } from './roleRatingStorage';
import type { RoleRating } from '@avalon/types';
let mongo: MongoMemoryServer;
const row = (rating: number) =>
  ({ userID: 'p', role: 'merlin', gamesCount: 20, rating, rank: 1, winrate: 50 }) as RoleRating;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await ensureRoleRatingIndexes();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test('failed staging leaves the published leaderboard and history intact', async () => {
  await publishRoleRatings([row(10)], new Date('2026-09-26'));
  await expect(publishRoleRatings([row(20), row(30)], new Date('2026-09-27'))).rejects.toThrow();
  expect((await readRoleRatings({ role: 'merlin' }, { rank: 1 }, 20))[0].rating).toBe(10);
  expect(await readRoleHistory('p', 'merlin', new Date('2026-09-01'))).toEqual([
    { date: new Date('2026-09-26'), rating: 10, rank: 1 },
  ]);
  await publishRoleRatings([row(40)], new Date('2026-09-27'));
  expect((await readRoleRatings({ userID: 'p' }, { rating: -1 }))[0].rating).toBe(40);
  expect(await readRoleHistory('p', 'merlin', new Date('2026-09-01'))).toHaveLength(2);
});

test('a captured leaderboard generation stays consistent through another publication', async () => {
  const { roleRatingView } = await import('./roleRatingStorage');
  const view = await roleRatingView();
  await publishRoleRatings([row(80)], new Date('2026-09-28'));
  expect((await view.collection.findOne({ ...view.filter, userID: 'p' }))?.rating).toBe(40);
});

test('archive recomputation deduplicates legacy room IDs while streaming projected rows', async () => {
  const { roomModel } = await import('@/db/models');
  const { updateRatings } = await import('./updateRatings');
  await roomModel.init();
  await roomModel.collection.dropIndex('roomID_1'); // Simulate a pre-migration archive.
  const room = (id: string) => ({
    roomID: id,
    startAt: '2026-09-27',
    game: { players: [{ id: 'p', role: 'merlin' }], result: { winner: 'good', reason: 'missions' } },
  });
  await roomModel.collection.insertMany([...Array.from({ length: 11 }, (_, i) => room(String(i))), room('0')]);
  await updateRatings();
  expect((await readRoleRatings({ userID: 'p' }, { rating: -1 }))[0].gamesCount).toBe(11);
});

test('an expired staged computation cannot publish after cleanup or a newer run', async () => {
  const storage = await import('./roleRatingStorage');
  const begin = (storage as unknown as { beginRoleRatingPublication(): Promise<unknown> }).beginRoleRatingPublication;
  expect(typeof begin).toBe('function');
  const old = await begin();
  await publishRoleRatings([row(99)], new Date());
  await expect(
    (publishRoleRatings as (...args: unknown[]) => Promise<void>)([row(1)], new Date(), old),
  ).rejects.toThrow();
  expect((await readRoleRatings({ userID: 'p' }, { rating: -1 }))[0].rating).toBe(99);
});

test('orphan cleanup preserves current entries and gives superseded readers a grace period', async () => {
  const storage = await import('./roleRatingStorage');
  const clean = (storage as unknown as { cleanupRoleRatingGenerations(now?: Date): Promise<void> })
    .cleanupRoleRatingGenerations;
  expect(typeof clean).toBe('function');
  const entries = mongoose.connection.db!.collection('role_rating_generations');
  await entries.insertOne({ ...row(1), generation: 'orphan', createdAt: new Date('2000-01-01'), date: new Date() });
  await clean(new Date());
  expect(await entries.countDocuments({ generation: 'orphan' })).toBe(1);
  await clean(new Date(Date.now() + 2 * 86400000));
  expect(await entries.countDocuments({ generation: 'orphan' })).toBe(0);
  expect((await readRoleRatings({ userID: 'p' }, { rating: -1 }))[0].rating).toBe(99);
});

test('history no longer reads retired array snapshots after the completed migration', async () => {
  await mongoose.connection.db!.collection('rolerankings').insertOne({
    date: new Date('2099-01-01'),
    ratings: 'retired-format',
  });
  expect(await readRoleHistory('p', 'merlin', new Date('2099-01-01'))).toEqual([]);
});

test('normalized history preserves zero ratings and missing-player points', async () => {
  const date = new Date('2098-01-01');
  await publishRoleRatings([row(0)], date);
  expect(await readRoleHistory('p', 'merlin', date)).toEqual([{ date, rating: 0, rank: 1 }]);
  expect(await readRoleHistory('missing', 'merlin', date)).toEqual([{ date, rating: null, rank: null }]);
});
