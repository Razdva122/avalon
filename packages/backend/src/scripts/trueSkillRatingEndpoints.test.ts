import { registerTrueSkillRatingEndpoints } from './trueSkillRatingEndpoints';
import type { ServerSocket } from '@avalon/types';

let total = 0;
let features: Record<string, unknown> = {};
let rating: Record<string, any> | null;
const updateOne = jest.fn(async (query, update) => {
  if (
    !rating ||
    query.userID !== rating.userID ||
    ('lastResetAt' in query && Number(query.lastResetAt) !== Number(rating.lastResetAt ?? null))
  ) {
    return { matchedCount: 0 };
  }
  Object.assign(rating, update.$set);
  return { matchedCount: 1 };
});
jest.mock('@/support/repository', () => ({ supportTotalCents: async () => total }));
jest.mock('../db/models', () => ({
  playerTrueSkillRatingModel: {
    findOne: () => ({ lean: async () => rating && { ...rating } }),
    updateOne: (...args: [unknown, unknown]) => updateOne(...args),
  },
  gameTrueSkillResultModel: {},
  userFeaturesModel: { findOne: () => ({ lean: async () => features }) },
}));

function endpoints(userID: string | undefined = 'player') {
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  registerTrueSkillRatingEndpoints(
    {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
      },
    } as ServerSocket,
    userID,
  );
  return async (name: string, target = 'player') => {
    let result: any;
    await handlers[name](target, (value: unknown) => {
      result = value;
    });
    return result;
  };
}
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-17T12:00:00Z'));
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
  updateOne.mockClear();
});
afterEach(() => jest.useRealTimers());

test.each(['paid', 'granted'])('%s Premium can reset at one month even with its badge hidden', async (mode) => {
  total = mode === 'paid' ? 1000 : 0;
  features = { showPremiumBadge: false, ...(mode === 'granted' ? { premiumGrantedAt: new Date() } : {}) };
  const call = endpoints();
  expect(await call('getTrueSkillRating')).toMatchObject({
    resetCooldownMonths: 1,
    nextResetAvailableAt: new Date('2026-09-17T12:00:00Z'),
  });
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: true });
  expect(rating).toMatchObject({
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
  expect(rating?.mu).toBe(7000);
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
  expect(rating?.mu).toBe(7000);
});

test('a first reset is available and simultaneous requests cannot both succeed', async () => {
  delete rating!.lastResetAt;
  const call = endpoints();
  const results = await Promise.all([call('resetTrueSkillRating'), call('resetTrueSkillRating')]);
  expect(results.filter((result) => result.success)).toHaveLength(1);
});

test('reset only applies to the authenticated account', async () => {
  delete rating!.lastResetAt;
  expect(await endpoints('other')('resetTrueSkillRating')).toMatchObject({ success: false });
  expect(await endpoints('')('resetTrueSkillRating')).toMatchObject({ success: false });
  expect(updateOne).not.toHaveBeenCalled();
});

test.each([
  [1000, '2026-01-31T12:00:00Z', '2026-02-28T12:00:00Z'],
  [1000, '2028-01-31T12:00:00Z', '2028-02-29T12:00:00Z'],
  [0, '2026-11-30T12:00:00Z', '2027-02-28T12:00:00Z'],
])('calendar cooldown clamps to the last day of a shorter month', async (amount, last, next) => {
  total = amount;
  rating!.lastResetAt = new Date(last);
  jest.setSystemTime(new Date(new Date(next).getTime() - 1));
  const call = endpoints();
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: false, nextResetAvailableAt: new Date(next) });
  jest.setSystemTime(new Date(next));
  expect(await call('resetTrueSkillRating')).toMatchObject({ success: true });
});
