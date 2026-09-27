import { AsyncLocalStorage } from 'node:async_hooks';
export const achievementGameContext = new AsyncLocalStorage<number>();
import { userChannel } from '@/helpers/channels';
import { Achievement, UserAchievement, AchievementStats } from '@avalon/types';
import { Server } from 'socket.io';
import { achievementModel, userAchievementModel, achievementStatsModel, userFeaturesModel } from '../db/models';
import { AchievementHandlers } from './handlers';

/**
 * Сервис для работы с достижениями
 */
export class AchievementService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }
  /**
   * Получение всех достижений
   */
  async getAllAchievements(): Promise<Achievement[]> {
    return achievementModel.find().lean();
  }

  /**
   * Получение достижений пользователя
   */
  async getUserAchievements(userID: string): Promise<UserAchievement[]> {
    return userAchievementModel.find({ userID }).lean();
  }

  /**
   * Получение статистики по достижениям
   */
  async getAchievementStats(): Promise<AchievementStats[]> {
    return achievementStatsModel.find().lean();
  }

  /**
   * Обновление прогресса достижения
   */
  async updateAchievementProgress(
    userID: string,
    achievementID: string,
    newStateKey?: string | number,
    gameSequence = achievementGameContext.getStore(),
  ): Promise<UserAchievement> {
    // Получаем информацию о достижении
    const achievement = await achievementModel.findOne({ id: achievementID }).lean();
    if (!achievement) {
      throw new Error(`Achievement ${achievementID} not found`);
    }

    const key = newStateKey === undefined ? undefined : String(newStateKey);
    const allowed = {
      $and: [
        { $ne: [{ $ifNull: ['$completed', false] }, true] },
        ...(key === undefined
          ? []
          : [{ $ne: [{ $getField: { field: key, input: { $ifNull: ['$state', {}] } } }, true] }]),
        ...(gameSequence === undefined ? [] : [{ $lt: [{ $ifNull: ['$lastGameSequence', 0] }, gameSequence] }]),
      ],
    };
    const pipeline = [
      { $set: { _advance: allowed, userID: { $literal: userID }, achievementID: { $literal: achievementID } } },
      {
        $set: {
          currentProgress: { $add: [{ $ifNull: ['$currentProgress', 0] }, { $cond: ['$_advance', 1, 0] }] },
          state:
            key === undefined
              ? { $ifNull: ['$state', {}] }
              : {
                  $cond: [
                    '$_advance',
                    { $mergeObjects: [{ $ifNull: ['$state', {}] }, { $literal: { [key]: true } }] },
                    { $ifNull: ['$state', {}] },
                  ],
                },
          ...(gameSequence === undefined
            ? {}
            : { lastGameSequence: { $max: [{ $ifNull: ['$lastGameSequence', 0] }, gameSequence] } }),
          updatedAt: '$$NOW',
        },
      },
      {
        $set: {
          completed: { $gte: ['$currentProgress', achievement.requirement] },
          completedAt: {
            $cond: [
              { $and: ['$_advance', { $gte: ['$currentProgress', achievement.requirement] }] },
              '$$NOW',
              '$completedAt',
            ],
          },
        },
      },
      { $unset: '_advance' },
    ];
    // Unique natural key prevents duplicate first writes. Retry an upsert race against its winner.
    const apply = () =>
      userAchievementModel
        .findOneAndUpdate({ userID, achievementID }, pipeline, {
          upsert: true,
          returnDocument: 'before',
          updatePipeline: true,
        })
        .lean();
    let previous;
    try {
      previous = await apply();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      previous = await apply();
    }
    const updated = await userAchievementModel.findOne({ userID, achievementID }).lean();
    if (!updated) throw new Error('Achievement update disappeared');
    const advanced =
      !previous?.completed &&
      (key === undefined || previous?.state?.[key] !== true) &&
      (gameSequence === undefined || (previous?.lastGameSequence ?? 0) < gameSequence);
    if (updated.completed) {
      // Recompute even on a replay: a previous attempt may have failed after progress was committed.
      await this.updateAchievementStats(achievementID);
      if (advanced && (previous?.currentProgress ?? 0) + 1 >= achievement.requirement)
        this.notifyAchievementUnlocked(userID, achievementID);
    } else if (advanced) {
      this.notifyAchievementProgress(userID, achievementID, updated.currentProgress, achievement.requirement);
    }
    return updated;
  }

  /**
   * Обновление статистики достижения
   */
  private async updateAchievementStats(achievementID: string): Promise<void> {
    // Подсчитываем пользователей, у которых есть дата последней игры (т.е. они сыграли хотя бы одну игру)
    const totalUsers = await userFeaturesModel.countDocuments({
      lastGameDate: { $exists: true },
    });

    const completedUsers = await userAchievementModel.countDocuments({
      achievementID,
      completed: true,
    });

    const apply = () =>
      achievementStatsModel.findOneAndUpdate(
        { achievementID },
        [
          {
            $set: {
              achievementID: { $literal: achievementID },
              totalUsers: { $max: [{ $ifNull: ['$totalUsers', 0] }, totalUsers] },
              completedUsers: { $max: [{ $ifNull: ['$completedUsers', 0] }, completedUsers] },
            },
          },
          {
            $set: {
              completionPercentage: {
                $cond: [
                  { $gt: ['$totalUsers', 0] },
                  { $multiply: [{ $divide: ['$completedUsers', '$totalUsers'] }, 100] },
                  0,
                ],
              },
            },
          },
        ],
        { upsert: true, updatePipeline: true },
      );
    try {
      await apply();
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      await apply();
    }
  }

  /**
   * Отправка уведомления о получении достижения
   */
  private notifyAchievementUnlocked(userID: string, achievementID: string): void {
    try {
      if (this.io) {
        this.io.to(userChannel(userID)).emit('achievementUnlocked', achievementID);
      }
    } catch (error) {
      console.error('Error sending achievement unlocked notification:', error);
    }
  }

  /**
   * Отправка уведомления о прогрессе в достижении
   */
  private notifyAchievementProgress(
    userID: string,
    achievementID: string,
    currentProgress: number,
    requirement: number,
  ): void {
    try {
      if (this.io) {
        this.io.to(userChannel(userID)).emit('achievementProgress', {
          achievementID,
          currentProgress,
          requirement,
        });
      }
    } catch (error) {
      console.error('Error sending achievement progress notification:', error);
    }
  }
}

/**
 * Менеджер достижений
 */
export class AchievementManager {
  public achievementHandlers: AchievementHandlers;
  public achievementService: AchievementService;

  constructor(io: Server) {
    this.achievementService = new AchievementService(io);
    this.achievementHandlers = new AchievementHandlers(this.achievementService);
  }
}
