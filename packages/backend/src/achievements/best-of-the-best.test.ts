import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import type { Server } from 'socket.io';
import { ACHIEVEMENT_BEST_OF_THE_BEST, isStickerAvailable, STICKERS, VisualGameState } from '@avalon/types';
import { AchievementService } from './index';
import { AchievementHandlers } from './handlers';
import { backfillBestOfTheBest } from './best-of-the-best-backfill';
import {
  achievementModel,
  userAchievementModel,
  playerTrueSkillRatingModel,
  gameTrueSkillResultModel,
} from '@/db/models';
import { eventBus } from '@/helpers';
import { drainRatingOperations, setGameCompletionHandler } from '@/scripts/rating-operations';

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
  setGameCompletionHandler(async () => {});
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

const day = (n: number) => new Date(Date.UTC(2026, 0, n));
async function history(userID: string, segments: number[], peaks: number[], gap = false) {
  let ordinal = 0;
  for (let segment = 0; segment < segments.length; segment++) {
    let oldMu = gap && segment ? 6100 : 6000;
    let oldSigma = gap && segment ? 1400 : 1500;
    for (let i = 1; i <= segments[segment]; i++) {
      ordinal++;
      const newMu = i === segments[segment] ? peaks[segment] : 6200;
      await gameTrueSkillResultModel.collection.insertOne({
        gameID: `${userID}-${ordinal}`,
        playedAt: day(ordinal),
        playerChanges: [{ userID, oldMu, oldSigma, newMu, newSigma: 1000 }],
      });
      oldMu = newMu;
      oldSigma = 1000;
    }
  }
  await playerTrueSkillRatingModel.create({ userID, mu: peaks[peaks.length - 1], sigma: 1000, gamesCount: ordinal });
}

test('backfill segments older resets, preserves pre-reset winners and is idempotent', async () => {
  await history('old-winner', [10, 2], [6800, 6000]);
  await history('early-peak', [9, 9], [6900, 7000]);
  await history('new-winner', [4, 10], [7000, 6800]);
  await history('gap', [9, 1], [7000, 7100], true);
  await history('reset-without-next-game', [10], [6800]);
  await playerTrueSkillRatingModel.updateOne(
    { userID: 'reset-without-next-game' },
    { $set: { mu: 6000, sigma: 1500, lastResetAt: day(11) } },
  );
  const db = mongoose.connection.db!;
  expect(await backfillBestOfTheBest(db)).toMatchObject({ eligible: 3, granted: 0, resets: 3, gaps: 1 });
  expect(await userAchievementModel.countDocuments()).toBe(0);
  expect(await backfillBestOfTheBest(db, true)).toMatchObject({ eligible: 3, granted: 3 });
  const awards = await userAchievementModel.find({ completed: true }).sort({ userID: 1 }).lean();
  expect(awards.map((a) => a.userID)).toEqual(['new-winner', 'old-winner', 'reset-without-next-game']);
  expect(awards.find((a) => a.userID === 'old-winner')?.completedAt).toEqual(day(10));
  expect(await playerTrueSkillRatingModel.findOne({ userID: 'old-winner' }).lean()).toMatchObject({
    gamesSinceReset: 2,
    gamesCount: 12,
  });
  expect(await playerTrueSkillRatingModel.findOne({ userID: 'reset-without-next-game' }).lean()).toMatchObject({
    gamesSinceReset: 0,
  });
  expect(await backfillBestOfTheBest(db, true)).toMatchObject({ granted: 0 });
  expect(await userAchievementModel.countDocuments({ completed: true })).toBe(3);
});

test('latest explicit reset also breaks a continuous legacy history and leaves only post-reset games', async () => {
  await history('explicit', [12], [6800]);
  await playerTrueSkillRatingModel.updateOne(
    { userID: 'explicit' },
    { $set: { lastResetAt: new Date(day(5).getTime() + 1) } },
  );
  await backfillBestOfTheBest(mongoose.connection.db!, true);
  expect(await userAchievementModel.countDocuments({ completed: true })).toBe(0);
  expect(await playerTrueSkillRatingModel.findOne({ userID: 'explicit' }).lean()).toMatchObject({ gamesSinceReset: 7 });
});

test.each([
  ['game', 'planned'],
  ['game', 'partial'],
  ['game', 'result'],
  ['reset', 'planned'],
  ['reset', 'partial'],
])('startup upgrades a legacy %s operation at the %s stage before resuming it', async (kind, stage) => {
  await history('pending-user', [9], [6200]);
  const db = mongoose.connection.db!;
  const isGame = kind === 'game';
  const values = {
    userID: 'pending-user',
    mu: isGame ? 6800 : 6000,
    sigma: isGame ? 1000 : 1500,
    gamesCount: isGame ? 10 : 9,
    wins: 0,
    losses: 0,
    conservativeRating: 1500,
    ...(isGame ? { lastPlayedAt: day(10) } : { lastResetAt: day(10) }),
  };
  const change = { userID: 'pending-user', oldMu: 6200, oldSigma: 1000, newMu: 6800, newSigma: 1000 };
  const game = { uuid: 'pending', players: [], result: { winner: 'good' } } as unknown as VisualGameState;
  if (stage !== 'planned')
    await playerTrueSkillRatingModel.updateOne({ userID: 'pending-user' }, { $set: { ...values, ratingSequence: 1 } });
  if (stage === 'result')
    await gameTrueSkillResultModel.collection.insertOne({
      gameID: 'pending',
      playedAt: day(10),
      playerChanges: [change],
    });
  await db
    .collection<{ _id: string; active: string; sequence: number }>('rating_controller')
    .insertOne({ _id: 'ratings', active: 'pending', sequence: 1 });
  await db.collection<{ _id: string; [key: string]: unknown }>('rating_operations').insertOne({
    _id: 'pending',
    kind,
    done: false,
    createdAt: day(10),
    game: isGame ? game : undefined,
    userID: 'pending-user',
    plan: { players: [values], changes: isGame ? [change] : [] },
  });
  await backfillBestOfTheBest(db, true);
  await backfillBestOfTheBest(db, true);
  const handlers = new AchievementHandlers(service);
  setGameCompletionHandler((g, sequence) => handlers.handleGameEnd(g, sequence));
  await drainRatingOperations();
  expect(await playerTrueSkillRatingModel.findOne({ userID: 'pending-user' }).lean()).toMatchObject({
    gamesSinceReset: isGame ? 10 : 0,
  });
  expect(await userAchievementModel.countDocuments({ completed: true })).toBe(isGame ? 1 : 0);
  if (isGame)
    expect((await gameTrueSkillResultModel.findOne({ gameID: 'pending' }).lean())?.playerChanges[0]).toMatchObject({
      gamesSinceReset: 10,
    });
});
