import { Achievement, AchievementType } from '@avalon/types';
import {
  ACHIEVEMENT_LIGHT_WINS,
  ACHIEVEMENT_DARK_WINS,
  ACHIEVEMENT_ALL_STANDARD_ROLES,
  ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
  ACHIEVEMENT_ASSASSIN_KILLS,
  ACHIEVEMENT_TOP_PLAYER,
  ACHIEVEMENT_UNDERCOVER_AGENT,
  ACHIEVEMENT_USELESS_ROLE,
  ACHIEVEMENT_STILL_WORTHY,
  ACHIEVEMENT_DETECTIVE,
  ACHIEVEMENT_MISTAKES_HAPPEN,
  ACHIEVEMENT_SERIAL_KILLER,
  ACHIEVEMENT_WRONG_CHOICE,
  ACHIEVEMENT_BODYGUARD,
  ACHIEVEMENT_SEER,
  ACHIEVEMENT_SECRET_HUNTER,
  SUPPORTED_PLAYER_COUNTS,
  ASSASSIN_TARGETS,
  STANDARD_ROLES,
} from '@avalon/types';

/**
 * Данные для инициализации достижений
 */
export const achievementsData: Partial<Achievement>[] = [
  // Открытые достижения
  {
    id: ACHIEVEMENT_LIGHT_WINS,
    type: AchievementType.OPEN,
    requirement: 10,
  },
  {
    id: ACHIEVEMENT_DARK_WINS,
    type: AchievementType.OPEN,
    requirement: 10,
  },
  {
    id: ACHIEVEMENT_ALL_STANDARD_ROLES,
    type: AchievementType.OPEN,
    requirement: STANDARD_ROLES.length,
    metadata: {
      roles: STANDARD_ROLES,
    },
  },
  {
    id: ACHIEVEMENT_DIFFERENT_PLAYER_COUNT,
    type: AchievementType.OPEN,
    requirement: SUPPORTED_PLAYER_COUNTS.length,
    metadata: {
      playerCounts: SUPPORTED_PLAYER_COUNTS,
    },
  },
  {
    id: ACHIEVEMENT_ASSASSIN_KILLS,
    type: AchievementType.OPEN,
    requirement: 5,
  },
  {
    id: ACHIEVEMENT_TOP_PLAYER,
    type: AchievementType.OPEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_SECRET_HUNTER,
    type: AchievementType.OPEN,
    requirement: 1,
  },

  // Скрытые достижения
  {
    id: ACHIEVEMENT_UNDERCOVER_AGENT,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_USELESS_ROLE,
    type: AchievementType.HIDDEN,
    requirement: 5,
  },
  {
    id: ACHIEVEMENT_STILL_WORTHY,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_DETECTIVE,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_MISTAKES_HAPPEN,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_SERIAL_KILLER,
    type: AchievementType.HIDDEN,
    requirement: ASSASSIN_TARGETS.length,
    metadata: {
      targets: ASSASSIN_TARGETS,
    },
  },
  {
    id: ACHIEVEMENT_WRONG_CHOICE,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_BODYGUARD,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
  {
    id: ACHIEVEMENT_SEER,
    type: AchievementType.HIDDEN,
    requirement: 1,
  },
];
