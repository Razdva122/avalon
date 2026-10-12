import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createTestMongo } from '@/test-utils/mongo';
import { StickersManager } from './index';
import { roomModel } from '@/db/models';
let mongo: MongoMemoryServer;
beforeAll(async () => {
  mongo = await createTestMongo();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test('stickers use the indexed player list, deduplicate old rooms, and refresh after a saved game', async () => {
  await roomModel.init();
  await roomModel.collection.dropIndex('roomID_1'); // Legacy archives may predate uniqueness.
  const room = (roomID: string) => ({
    roomID,
    players: [{ id: 'p' }],
    game: { stage: 'end', result: { winner: 'good', reason: 'missions' } },
  });
  await roomModel.collection.insertMany([room('a'), room('a')]);
  const manager = new StickersManager();
  const first = await manager.collection('p');
  expect(first.stickers.find((s) => s.id === 'servant-wave')?.available).toBe(true);
  expect(first.stickers.find((s) => s.id === 'percival-toast')?.progress).toBe(1);
  await roomModel.collection.insertMany(['b', 'c', 'd', 'e'].map(room));
  (manager as unknown as { invalidateGameCounts(ids: string[]): void }).invalidateGameCounts(['p']);
  expect((await manager.collection('p')).stickers.find((s) => s.id === 'percival-toast')?.available).toBe(true);
});
