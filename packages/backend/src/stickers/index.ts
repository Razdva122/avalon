import {
  STICKERS,
  DEFAULT_STICKER_FAVORITES,
  STICKER_FAVORITES_LIMIT,
  STICKER_COOLDOWN_MS,
  isStickerAvailable,
} from '@avalon/types';
import type { StickerCollection, StickerError } from '@avalon/types';
import { roomModel, userAchievementModel, userFeaturesModel } from '@/db/models';
import { achievementsData } from '@/achievements/data';
import { hasPremium } from '@/support/premium';
import { supportTotalCents } from '@/support/repository';

export class StickersManager {
  private sending = new Set<string>();
  private lastSent = new Map<string, number>();

  async collection(userID: string): Promise<StickerCollection> {
    const [games, achievements, features, total] = await Promise.all([
      roomModel.distinct('roomID', {
        'game.players.id': userID,
        'game.stage': 'end',
        'game.result.winner': { $in: ['good', 'evil'] },
        'game.result.reason': { $ne: 'manualy' },
      }),
      userAchievementModel.find({ userID }).lean(),
      userFeaturesModel.findOne({ userID }).lean(),
      supportTotalCents(userID),
    ]);
    const completed = achievements.filter((a) => a.completed).map((a) => a.achievementID);
    const stickers = STICKERS.map((sticker) => {
      const available = isStickerAvailable(sticker, games.length, completed, hasPremium(total, features));
      const achievement = achievements.find((a) => a.achievementID === sticker.achievement);
      const requirement = sticker.games || achievementsData.find((a) => a.id === sticker.achievement)?.requirement || 1;
      const secret = sticker.hidden && !available;
      return {
        id: sticker.id,
        available,
        requirement: secret ? 1 : requirement,
        progress: secret
          ? 0
          : Math.min(
              requirement,
              sticker.premium
                ? Number(available)
                : sticker.achievement
                  ? achievement?.currentProgress || 0
                  : sticker.games
                    ? games.length
                    : 1,
            ),
        isNew:
          available &&
          !!(sticker.games || sticker.achievement || sticker.premium) &&
          !(features?.seenStickers || []).includes(sticker.id),
      };
    });
    return {
      stickers,
      favorites: (features?.favoriteStickers ?? DEFAULT_STICKER_FAVORITES).filter((id) =>
        stickers.some((s) => s.id === id && s.available),
      ),
      hideOnBoard: features?.hideStickersOnBoard || false,
    };
  }

  async preferences(
    userID: string,
    favorites: string[],
    hideOnBoard: boolean,
  ): Promise<StickerCollection | StickerError> {
    if (
      !Array.isArray(favorites) ||
      favorites.length > STICKER_FAVORITES_LIMIT ||
      new Set(favorites).size !== favorites.length ||
      typeof hideOnBoard !== 'boolean'
    )
      return { error: 'invalid' };
    const collection = await this.collection(userID);
    if (favorites.some((id) => !collection.stickers.some((s) => s.id === id && s.available)))
      return { error: 'unavailable' };
    await userFeaturesModel.updateOne(
      { userID },
      { $set: { favoriteStickers: favorites, hideStickersOnBoard: hideOnBoard } },
      { upsert: true },
    );
    return { ...collection, favorites, hideOnBoard };
  }

  async seen(userID: string, ids: string[]): Promise<void> {
    const collection = await this.collection(userID);
    const available = collection.stickers.filter((s) => s.available && ids.includes(s.id)).map((s) => s.id);
    await userFeaturesModel.updateOne(
      { userID },
      { $addToSet: { seenStickers: { $each: available } } },
      { upsert: true },
    );
  }

  async authorizeSend(userID: string, stickerID: string, deliver: () => void): Promise<true | StickerError> {
    if (!STICKERS.some((s) => s.id === stickerID)) return { error: 'invalid' };
    const now = Date.now();
    const retryAfter = STICKER_COOLDOWN_MS - (now - (this.lastSent.get(userID) || 0));
    if (this.sending.has(userID) || retryAfter > 0)
      return { error: 'cooldown', retryAfter: Math.max(1000, retryAfter) };
    this.sending.add(userID);
    try {
      const collection = await this.collection(userID);
      if (!collection.stickers.some((s) => s.id === stickerID && s.available)) return { error: 'unavailable' };
      deliver();
      this.lastSent.set(userID, Date.now());
      for (const [id, time] of this.lastSent) if (Date.now() - time >= STICKER_COOLDOWN_MS) this.lastSent.delete(id);
      return true;
    } finally {
      this.sending.delete(userID);
    }
  }
}
