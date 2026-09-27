import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { playerTrueSkillRatingModel, trueSkillRatingHistoryModel } from '@/db/models';
import { createTrueSkillRatingSnapshot } from './updateTrueSkillRatings';
let mongo: MongoMemoryServer;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test('daily TrueSkill snapshots store one row per player instead of one growing array', async () => {
  await playerTrueSkillRatingModel.create([
    { userID: 'a', mu: 3000, gamesCount: 100 },
    { userID: 'b', mu: 2000, gamesCount: 100 },
  ]);
  await createTrueSkillRatingSnapshot();
  const publications = await mongoose.connection.db!.collection('trueskill_snapshot_publications').find().toArray();
  expect(publications).toHaveLength(1);
  const rows = await mongoose.connection
    .db!.collection('trueskill_snapshot_entries')
    .find({ generation: publications[0].generation })
    .sort({ rank: 1 })
    .toArray();
  expect(rows.map((row) => row.userID)).toEqual(['a', 'b']);
  expect(await trueSkillRatingHistoryModel.countDocuments()).toBe(0);
});

test('snapshot cleanup retires abandoned staging rows without deleting a published snapshot', async () => {
  const storage = await import('./trueSkillSnapshotStorage');
  const clean = (storage as unknown as { cleanupTrueSkillSnapshots(now?: Date): Promise<void> })
    .cleanupTrueSkillSnapshots;
  expect(typeof clean).toBe('function');
  const db = mongoose.connection.db!;
  await db
    .collection('trueskill_snapshot_entries')
    .insertOne({ generation: 'orphan', day: '2000-01-01', createdAt: new Date('2000-01-01'), userID: 'orphan' });
  await clean(new Date());
  expect(await db.collection('trueskill_snapshot_entries').countDocuments({ generation: 'orphan' })).toBe(1);
  await clean(new Date(Date.now() + 2 * 86400000));
  expect(await db.collection('trueskill_snapshot_entries').countDocuments({ generation: 'orphan' })).toBe(0);
  expect(await db.collection('trueskill_snapshot_entries').countDocuments()).toBe(2);
});
