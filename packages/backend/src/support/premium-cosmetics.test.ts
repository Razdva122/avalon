import { AvatarsManager } from '@/user/avatars';
import { StickersManager } from '@/stickers';
import type { DBManager } from '@/db';
import { DEFAULT_STICKER_FAVORITES } from '@avalon/types';

let total = 0;
// Keep the future enabled behavior covered while the release flag is off.
jest.mock('@avalon/types/user/premium-cosmetics', () => ({ PREMIUM_COSMETICS_ENABLED: true }));
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

test('non-premium players can preview exclusives but cannot equip or send them', async () => {
  const avatars = new AvatarsManager(db);
  expect(await avatars.getAvailableAvatarsForUser('player')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'premium/puppeteer', available: false }),
      expect.objectContaining({ id: 'premium/eclipse-queen', available: false }),
    ]),
  );
  expect(await avatars.updateUserAvatar('player', 'premium/puppeteer')).toEqual({ error: 'avatarNotAvailable' });
  expect(savedAvatar).toBe('servant');
  const stickers = new StickersManager();
  expect((await stickers.collection('player')).stickers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'mordred-puppet', available: false, progress: 0, isNew: false }),
      expect.objectContaining({ id: 'morgana-violin', available: false }),
    ]),
  );
  let delivered = false;
  expect(
    await stickers.authorizeSend('player', 'mordred-puppet', () => {
      delivered = true;
    }),
  ).toEqual({ error: 'unavailable' });
  expect(delivered).toBe(false);
  expect(await stickers.preferences('player', ['morgana-violin'], false)).toEqual({ error: 'unavailable' });
});

test.each(['paid', 'manual'])('%s Premium unlocks cosmetics even with the badge hidden', async (mode) => {
  total = mode === 'paid' ? 1000 : 0;
  features = { showPremiumBadge: false, ...(mode === 'manual' ? { premiumGrantedAt: new Date() } : {}) };
  const avatars = new AvatarsManager(db);
  for (const id of ['premium/puppeteer', 'premium/eclipse-queen']) {
    expect(await avatars.updateUserAvatar('player', id)).toBe(true);
    expect(savedAvatar).toBe(id);
  }
  const stickers = new StickersManager();
  expect((await stickers.collection('player')).stickers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'mordred-puppet', available: true, isNew: true }),
      expect.objectContaining({ id: 'morgana-violin', available: true, isNew: true }),
    ]),
  );
  expect(await stickers.preferences('player', ['morgana-violin'], false)).toMatchObject({
    favorites: ['morgana-violin'],
  });
  let delivered = false;
  expect(
    await stickers.authorizeSend('player', 'morgana-violin', () => {
      delivered = true;
    }),
  ).toBe(true);
  expect(delivered).toBe(true);
});

test('losing Premium removes exclusive favorites and blocks subsequent use', async () => {
  total = 1000;
  features = { favoriteStickers: ['servant-yes', 'mordred-puppet'] };
  const manager = new StickersManager();
  expect((await manager.collection('player')).favorites).toEqual(['servant-yes', 'mordred-puppet']);
  total = 999;
  expect((await manager.collection('player')).favorites).toEqual(['servant-yes']);
  expect(await new AvatarsManager(db).updateUserAvatar('player', 'premium/eclipse-queen')).toEqual({
    error: 'avatarNotAvailable',
  });
});

test('premium stickers never enter a new player’s starter favorites', () => {
  expect(DEFAULT_STICKER_FAVORITES).not.toContain('mordred-puppet');
  expect(DEFAULT_STICKER_FAVORITES).not.toContain('morgana-violin');
});
