import { AvatarsManager } from '@/user/avatars';
import { StickersManager } from '@/stickers';
import type { DBManager } from '@/db';
import { DEFAULT_STICKER_FAVORITES } from '@avalon/types';

let total = 0;
jest.mock('@avalon/types/user/premium-cosmetics', () => ({ PREMIUM_COSMETICS_ENABLED: false }));
let features: Record<string, unknown> = {};
let savedAvatar = 'servant';
jest.mock('@/support/repository', () => ({ supportTotalCents: async () => total }));
jest.mock('@/db/models', () => ({
  roomModel: { distinct: async () => [] },
  userAchievementModel: { find: () => ({ lean: async () => [] }) },
  userFeaturesModel: {
    findOne: () => ({ lean: async () => features }),
    updateOne: async (_query: unknown, update: { $set: Record<string, unknown> }) => {
      features = { ...features, ...update.$set };
    },
  },
}));
const db = {
  getUserByID: async () => ({ id: 'player', registrationDate: new Date() }),
  getUserFeatures: async () => features,
  getUserCompletedAchievements: async () => [],
  updateUserAvatar: async (_id: string, avatar: string) => {
    savedAvatar = avatar;
  },
} as unknown as DBManager;

beforeEach(() => {
  total = 0;
  features = {};
  savedAvatar = 'servant';
});

test('unreleased cosmetics stay hidden and unusable even for Premium accounts', async () => {
  total = 1000;
  features = { premiumGrantedAt: new Date(), favoriteStickers: ['servant-yes', 'morgana-violin'] };
  const avatars = new AvatarsManager(db);
  expect((await avatars.getAvailableAvatarsForUser('player')).some((a) => a.premium)).toBe(false);
  expect(await avatars.updateUserAvatar('player', 'premium/puppeteer')).toEqual({ error: 'avatarNotExist' });
  expect(savedAvatar).toBe('servant');
  const stickers = new StickersManager();
  const collection = await stickers.collection('player');
  expect(collection.stickers.some((s) => ['mordred-puppet', 'morgana-violin'].includes(s.id))).toBe(false);
  expect(collection.favorites).toEqual(['servant-yes']);
  let delivered = false;
  expect(
    await stickers.authorizeSend('player', 'morgana-violin', () => {
      delivered = true;
    }),
  ).toEqual({ error: 'invalid' });
  expect(delivered).toBe(false);
  expect(await stickers.preferences('player', ['mordred-puppet'], false)).toEqual({ error: 'unavailable' });
  expect(DEFAULT_STICKER_FAVORITES).toContain('servant-yes');
});
