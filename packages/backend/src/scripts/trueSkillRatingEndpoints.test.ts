import { registerTrueSkillRatingEndpoints } from './trueSkillRatingEndpoints';
import type { ServerSocket } from '@avalon/types';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { playerTrueSkillRatingModel, userFeaturesModel } from '@/db/models';
let mongo: MongoMemoryServer;
let total = 0;
let features: Record<string, unknown> = {};
let rating: Record<string, unknown>;
jest.mock('@/support/repository', () => ({ supportTotalCents: async () => total }));
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await playerTrueSkillRatingModel.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

function endpoints(
  userID: string | undefined = 'player',
  aiRating?: (id: string) => Promise<import('@avalon/types').PlayerTrueSkillRating | undefined>,
) {
  const handlers: Record<
    string,
    (userID: string, callback: (result: Record<string, unknown>) => void) => Promise<void>
  > = {};
  registerTrueSkillRatingEndpoints(
    {
      on: (
        name: string,
        handler: (userID: string, callback: (result: Record<string, unknown>) => void) => Promise<void>,
      ) => {
        handlers[name] = handler;
      },
    } as ServerSocket,
    userID,
    aiRating,
  );
  return async (name: string, target = 'player') => {
    let result: Record<string, unknown> = {};
    await handlers[name](target, (value: Record<string, unknown>) => {
      result = value;
    });
    return result;
  };
}
beforeEach(async () => {
  for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
  jest
    .useFakeTimers({
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'hrtime',
        'performance',
        'queueMicrotask',
      ],
    })
    .setSystemTime(new Date('2026-09-17T12:00:00Z'));
  total = 0;
  features = {};
  rating = {
    userID: 'player',
    mu: 7000,
    sigma: 500,
    conservativeRating: 5500,
    gamesCount: 40,
    wins: 25,
    losses: 15,
    lastResetAt: new Date('2026-08-17T12:00:00Z'),
  };
  await playerTrueSkillRatingModel.create(rating);
  jest.spyOn(userFeaturesModel, 'findOne').mockImplementation(() => ({ lean: async () => features }) as never);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('an account without rated games returns an empty rating without an error or database writes', async () => {
  await playerTrueSkillRatingModel.deleteMany({});
  expect(await endpoints()('getTrueSkillRating')).toEqual({ success: true });
  expect(await endpoints('other')('getTrueSkillRating')).toEqual({ success: true });
  expect(await playerTrueSkillRatingModel.countDocuments()).toBe(0);
});

test.each(['paid', 'granted'])('%s Premium can reset at one month even with its badge hidden', async (mode) => {
  total = mode === 'paid' ? 1000 : 0;
  features = { showPremiumBadge: false, ...(mode === 'granted' ? { premiumGrantedAt: new Date() } : {}) };
  const call = endpoints();
  expect(await call('getTrueSkillRating')).toMatchObject({
    resetCooldownMonths: 1,
    nextResetAvailableAt: new Date('2026-09-17T12:00:00Z'),
  });
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: true });
  expect(await playerTrueSkillRatingModel.findOne({ userID: 'player' }).lean()).toMatchObject({
    mu: 6000,
    sigma: 1500,
    conservativeRating: 1500,
    gamesCount: 40,
    wins: 25,
    losses: 15,
  });
  expect(await call('resetTrueSkillRating')).toMatchObject({
    success: false,
    nextResetAvailableAt: new Date('2026-10-17T12:00:00Z'),
  });
});

test('standard accounts keep the three-month cooldown and receive the actual next date', async () => {
  total = 999;
  const call = endpoints();
  expect(await call('getTrueSkillRating')).toMatchObject({
    resetCooldownMonths: 3,
    nextResetAvailableAt: new Date('2026-11-17T12:00:00Z'),
  });
  expect(await call('resetTrueSkillRating')).toMatchObject({
    success: false,
    nextResetAvailableAt: new Date('2026-11-17T12:00:00Z'),
  });
  expect((await playerTrueSkillRatingModel.findOne({ userID: 'player' }).lean())?.mu).toBe(7000);
  jest.setSystemTime(new Date('2026-11-17T12:00:00Z'));
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: true });
});

test('Premium cannot reset before a full month has elapsed', async () => {
  total = 1000;
  jest.setSystemTime(new Date('2026-09-17T11:59:59Z'));
  expect(await endpoints()('resetTrueSkillRating')).toMatchObject({
    success: false,
    nextResetAvailableAt: new Date('2026-09-17T12:00:00Z'),
  });
  expect((await playerTrueSkillRatingModel.findOne({ userID: 'player' }).lean())?.mu).toBe(7000);
});

test('a first reset is available and simultaneous requests cannot both succeed', async () => {
  await playerTrueSkillRatingModel.updateOne({ userID: 'player' }, { $unset: { lastResetAt: '' } });
  const call = endpoints();
  const results = await Promise.all([call('resetTrueSkillRating'), call('resetTrueSkillRating')]);
  expect(results.filter((result) => result.success)).toHaveLength(1);
});

test('reset only applies to the authenticated account', async () => {
  await playerTrueSkillRatingModel.updateOne({ userID: 'player' }, { $unset: { lastResetAt: '' } });
  expect(await endpoints('other')('resetTrueSkillRating')).toMatchObject({ success: false });
  expect(await endpoints('')('resetTrueSkillRating')).toMatchObject({ success: false });
  expect(await mongoose.connection.db!.collection('rating_operations').countDocuments()).toBe(0);
});

test.each([
  [1000, '2026-01-31T12:00:00Z', '2026-02-28T12:00:00Z'],
  [1000, '2028-01-31T12:00:00Z', '2028-02-29T12:00:00Z'],
  [0, '2026-11-30T12:00:00Z', '2027-02-28T12:00:00Z'],
])('calendar cooldown clamps to the last day of a shorter month', async (amount, last, next) => {
  total = amount;
  await playerTrueSkillRatingModel.updateOne({ userID: 'player' }, { $set: { lastResetAt: new Date(last) } });
  jest.setSystemTime(new Date(new Date(next).getTime() - 1));
  const call = endpoints();
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: false, nextResetAvailableAt: new Date(next) });
  jest.setSystemTime(new Date(next));
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: true });
});

test('AI profile endpoint uses isolated ratings and never falls back to human ratings', async () => {
  const humanCount = await playerTrueSkillRatingModel.countDocuments();
  const ai = { userID: 'avalon-agent-3', mu: 6123, gamesCount: 2 } as import('@avalon/types').PlayerTrueSkillRating;
  expect(await endpoints(undefined, async () => ai)('getTrueSkillRating', ai.userID)).toEqual({
    success: true,
    rating: ai,
  });
  expect(await endpoints()('getTrueSkillRating', ai.userID)).toMatchObject({ success: false });
  expect(await playerTrueSkillRatingModel.countDocuments()).toBe(humanCount);
});
