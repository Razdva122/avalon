import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import type { Server } from 'socket.io';
import { ACHIEVEMENT_BEST_OF_THE_BEST, isStickerAvailable, STICKERS, VisualGameState } from '@avalon/types';
import { AchievementService } from './index';
import { AchievementHandlers } from './handlers';
import {
  achievementModel,
  userAchievementModel,
  playerTrueSkillRatingModel,
  gameTrueSkillResultModel,
} from '@/db/models';
import { eventBus } from '@/helpers';

let mongo: MongoMemoryServer;
const service = new AchievementService({ to: () => ({ emit: () => {} }) } as unknown as Server);
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([userAchievementModel.init(), playerTrueSkillRatingModel.init(), gameTrueSkillResultModel.init()]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
  await achievementModel.create({ id: ACHIEVEMENT_BEST_OF_THE_BEST, requirement: 1 });
});
afterEach(() => {
  eventBus.removeAllListeners();
});

test('live award uses this match’s reset count and exact mu, and survives a later reset and replay', async () => {
  const handlers = new AchievementHandlers(service);
  const cases = [
    { userID: 'qualified', gamesSinceReset: 10, newMu: 6800 },
    { userID: 'too-early', gamesSinceReset: 9, newMu: 7200 },
    { userID: 'too-low', gamesSinceReset: 10, newMu: 6799.9 },
    { userID: 'legacy-without-count', newMu: 7200 },
  ];
  await gameTrueSkillResultModel.collection.insertOne({
    gameID: 'boundary',
    playedAt: new Date(),
    playerChanges: cases,
  });
  // Current mutable ratings must not be used when replaying an older result.
  await playerTrueSkillRatingModel.create({
    userID: 'qualified',
    mu: 6000,
    sigma: 1500,
    gamesCount: 200,
    gamesSinceReset: 0,
  });
  const game = { uuid: 'boundary', result: { winner: 'good' }, players: [] } as unknown as VisualGameState;
  await handlers.handleGameEnd(game, 1);
  await handlers.handleGameEnd(game, 1);
  const awards = await userAchievementModel.find({ achievementID: ACHIEVEMENT_BEST_OF_THE_BEST }).lean();
  expect(awards).toHaveLength(1);
  expect(awards[0]).toMatchObject({ userID: 'qualified', completed: true, currentProgress: 1 });
  const sticker = STICKERS.find((s) => s.id === 'cleric-best')!;
  expect(isStickerAvailable(sticker, 200, [])).toBe(false);
  expect(isStickerAvailable(sticker, 0, [awards[0].achievementID])).toBe(true);
});
