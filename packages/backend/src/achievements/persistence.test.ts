import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { AchievementService } from './index';
import { achievementModel, userAchievementModel } from '@/db/models';
import type { Server } from 'socket.io';

let mongo: MongoMemoryServer;
const service = new AchievementService({ to: () => ({ emit: () => {} }) } as unknown as Server);
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await userAchievementModel.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  await Promise.all([achievementModel.deleteMany({}), userAchievementModel.deleteMany({})]);
  await achievementModel.create({ id: 'counter', requirement: 100 });
});

test('concurrent distinct achievements keep every increment and state key', async () => {
  await Promise.all(
    Array.from({ length: 12 }, (_, i) => service.updateAchievementProgress('player', 'counter', String(i))),
  );
  const rows = await userAchievementModel.find({ userID: 'player', achievementID: 'counter' }).lean();
  expect(rows).toHaveLength(1);
  expect(rows[0].currentProgress).toBe(12);
  expect(Object.keys(rows[0].state || {})).toHaveLength(12);
});

test('retrying an ordered game event does not increment twice', async () => {
  const update = service.updateAchievementProgress.bind(service) as (...args: unknown[]) => Promise<unknown>;
  await update('player', 'counter', undefined, 1);
  await update('player', 'counter', undefined, 1);
  await update('player', 'counter', undefined, 2);
  await update('player', 'counter', undefined, 1);
  expect((await userAchievementModel.findOne({ userID: 'player' }))?.currentProgress).toBe(2);
});

test('concurrent completion emits one unlock and caps progress at the requirement', async () => {
  await achievementModel.updateOne({ id: 'counter' }, { $set: { requirement: 5 } });
  const events: string[] = [];
  const notifier = new AchievementService({
    to: () => ({ emit: (event: string) => events.push(event) }),
  } as unknown as Server);
  await Promise.all(
    Array.from({ length: 10 }, (_, i) => notifier.updateAchievementProgress('player', 'counter', String(i))),
  );
  expect((await userAchievementModel.findOne({ userID: 'player' }))?.currentProgress).toBe(5);
  expect(events.filter((event) => event === 'achievementUnlocked')).toHaveLength(1);
});
