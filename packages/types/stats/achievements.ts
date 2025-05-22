import { prop, modelOptions, Severity } from '@typegoose/typegoose';

/**
 * Типы достижений
 */
export enum AchievementType {
  OPEN = 'open', // Открытые достижения
  HIDDEN = 'hidden', // Скрытые достижения
}

/**
 * Mongoose model for Achievement
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class Achievement {
  @prop({ required: true, unique: true })
  id!: string; // Уникальный идентификатор достижения

  @prop({ required: true, enum: AchievementType, default: AchievementType.OPEN })
  type!: AchievementType; // Тип достижения (открытое/скрытое)

  @prop({ required: true, default: 0 })
  requirement!: number; // Требуемое значение для получения достижения

  @prop({ type: () => Object })
  metadata?: Record<string, unknown>; // Дополнительные данные для сложных достижений
}

/**
 * Mongoose model for UserAchievement
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class UserAchievement {
  @prop({ required: true })
  userID!: string; // ID пользователя

  @prop({ required: true })
  achievementID!: string; // ID достижения

  @prop({ required: true, default: 0 })
  currentProgress!: number; // Текущий прогресс

  @prop({ required: true, default: false })
  completed!: boolean; // Завершено ли достижение полностью

  @prop({ type: Date })
  completedAt?: Date; // Дата завершения достижения

  @prop({ type: Date, default: Date.now })
  updatedAt!: Date; // Дата последнего обновления

  @prop({ type: () => Object })
  state?: Record<string, unknown>; // Состояние достижения (для сложных достижений)
}

/**
 * Mongoose model for AchievementStats
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class AchievementStats {
  @prop({ required: true })
  achievementID!: string; // ID достижения

  @prop({ required: true, default: 0 })
  totalUsers!: number; // Общее количество пользователей

  @prop({ required: true, default: 0 })
  completedUsers!: number; // Количество пользователей, получивших достижение

  @prop({ required: true, default: 0 })
  completionPercentage!: number; // Процент завершения
}
