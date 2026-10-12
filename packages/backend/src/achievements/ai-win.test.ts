import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createTestMongo } from '@/test-utils/mongo';
import type { Server } from 'socket.io';
import { StartedRoomState, isStickerAvailable, STICKERS } from '@avalon/types';
import { AchievementService } from './index';
import { AchievementHandlers } from './handlers';
import { achievementsData } from './data';
import { achievementModel, userAchievementModel } from '@/db/models';
import { eventBus } from '@/helpers';

let mongo: MongoMemoryServer;
const service = new AchievementService({ to: () => ({ emit: () => {} }) } as unknown as Server);
beforeAll(async () => {
  mongo = await createTestMongo();
  await mongoose.connect(mongo.getUri());
  await userAchievementModel.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
  await achievementModel.insertMany(achievementsData);
});
afterEach(() => eventBus.removeAllListeners());

const state = (role = 'servant', winner = 'good', difficulty = 'regular') =>
  ({
    stage: 'started',
    ai: { humanPlayerID: 'human', publicBotGame: true, botDifficulty: difficulty },
    game: {
      uuid: 'ai-win',
      stage: 'end',
      result: { winner, reason: 'missions' },
      players: [
        { id: 'human', role },
        { id: 'avalon-agent-1', role: 'merlin' },
      ],
    },
  }) as unknown as StartedRoomState;
const handle = (room: StartedRoomState) => new AchievementHandlers(service).handleAiGameEnd(room);

test.each(['regular', 'smart'])('%s AI victory unlocks only the human reward once', async (difficulty) => {
  const room = state('servant', 'good', difficulty);
  await handle(room);
  await handle(room);
  const awards = await userAchievementModel.find().lean();
  expect(awards).toHaveLength(1);
  expect(awards[0]).toMatchObject({ userID: 'human', achievementID: 'ai_win', completed: true, currentProgress: 1 });
  const sticker = STICKERS.find((s) => s.id === 'morgana-panic')!;
  expect(sticker).toBeDefined();
  expect(isStickerAvailable(sticker, 100, [])).toBe(false);
  expect(isStickerAvailable(sticker, 0, ['ai_win'])).toBe(true);
});
test('evil human victory also unlocks the reward', async () => {
  await handle(state('morgana', 'evil'));
  expect(await userAchievementModel.countDocuments({ userID: 'human', completed: true })).toBe(1);
});
test.each(['loss', 'unfinished', 'cancelled', 'spectator', 'ordinary'])('%s does not award', async (mode) => {
  const room = state();
  if (mode === 'loss') room.game.result!.winner = 'evil';
  if (mode === 'unfinished') room.game.stage = 'assassinate';
  if (mode === 'cancelled') room.game.result!.reason = 'manualy';
  if (mode === 'spectator') delete room.ai!.humanPlayerID;
  if (mode === 'ordinary') delete room.ai;
  await handle(room);
  expect(await userAchievementModel.countDocuments()).toBe(0);
});

test('friend games award each winning human and exclude the losing human', async () => {
  const room = state('morgana', 'good');
  room.ai!.humanPlayerIDs = ['human', 'friend'];
  room.game.players.push({ id: 'friend', role: 'servant' } as (typeof room.game.players)[number]);
  await handle(room);
  const awards = await userAchievementModel.find().lean();
  expect(awards).toHaveLength(1);
  expect(awards[0]).toMatchObject({ userID: 'friend', achievementID: 'ai_win', completed: true });
});
