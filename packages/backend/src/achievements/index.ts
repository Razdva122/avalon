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
  ): Promise<UserAchievement> {
    // Получаем информацию о достижении
    const achievement = await achievementModel.findOne({ id: achievementID }).lean();
    if (!achievement) {
      throw new Error(`Achievement ${achievementID} not found`);
    }

    // Получаем текущий прогресс пользователя
    const userAchievement = await userAchievementModel
      .findOne({
        userID,
        achievementID,
      })
      .lean();

    // Если достижение уже завершено и не требуется принудительное обновление, возвращаем текущее состояние
    if (userAchievement?.completed) {
      return userAchievement;
    }

    if (newStateKey && userAchievement?.state?.[newStateKey] === true) {
      return userAchievement;
    }

    // Определяем текущий прогресс
    const currentProgress = userAchievement?.currentProgress ?? 0;

    // Обновляем прогресс
    const newProgress = currentProgress + 1;

    // Проверяем, достигнуто ли требуемое значение
    const wasCompleted = userAchievement?.completed ?? false;
    const completed = newProgress >= achievement.requirement;

    // Обновляем запись в базе данных
    const updatedAchievement = await userAchievementModel
      .findOneAndUpdate(
        { userID, achievementID },
        {
          $set: {
            currentProgress: newProgress,
            completed,
            completedAt: completed && !wasCompleted ? new Date() : userAchievement?.completedAt,
            state: newStateKey ? { ...userAchievement?.state, [newStateKey]: true } : undefined,
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .lean();

    // Если достижение было завершено, обновляем статистику и отправляем уведомление
    if (completed && !wasCompleted) {
      // Отправляем уведомление о новом достижении через Socket.io
      this.notifyAchievementUnlocked(userID, achievementID);

      await this.updateAchievementStats(achievementID);
    } else if (!completed && newProgress > currentProgress) {
      // Отправляем уведомление о прогрессе в достижении
      this.notifyAchievementProgress(userID, achievementID, newProgress, achievement.requirement);
    }

    return updatedAchievement;
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

    const completionPercentage = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

    await achievementStatsModel.findOneAndUpdate(
      { achievementID },
      {
        $set: {
          totalUsers,
          completedUsers,
          completionPercentage,
        },
      },
      { new: true, upsert: true },
    );
  }

  /**
   * Отправка уведомления о получении достижения
   */
  private notifyAchievementUnlocked(userID: string, achievementID: string): void {
    try {
      if (this.io) {
        this.io.to(userID).emit('achievementUnlocked', achievementID);
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
        this.io.to(userID).emit('achievementProgress', {
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
