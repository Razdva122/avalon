import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const userAchievements: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    title: 'User Achievements',
    description: 'Track your achievements and progress in Avalon Game',
    openAchievements: 'Open Achievements',
    hiddenAchievements: 'Hidden Achievements',
    summary: 'Achievement Summary',
    completed: 'Completed',
  },
  ru: {
    title: 'Достижения пользователя',
    description: 'Отслеживайте свои достижения и прогресс в Avalon Game',
    openAchievements: 'Открытые достижения',
    hiddenAchievements: 'Скрытые достижения',
    summary: 'Сводка достижений',
    completed: 'Выполнено',
  },
  es: {
    title: 'Logros del usuario',
    description: 'Sigue tus logros y progreso en Avalon Game',
    openAchievements: 'Logros abiertos',
    hiddenAchievements: 'Logros ocultos',
    summary: 'Resumen de logros',
    completed: 'Completado',
  },
  pt: {
    title: 'Conquistas do usuário',
    description: 'Acompanhe suas conquistas e progresso no Avalon Game',
    openAchievements: 'Conquistas abertas',
    hiddenAchievements: 'Conquistas ocultas',
    summary: 'Resumo de conquistas',
    completed: 'Concluído',
  },
  'zh-CN': {
    title: '用户成就',
    description: '跟踪您在Avalon Game中的成就和进度',
    openAchievements: '公开成就',
    hiddenAchievements: '隐藏成就',
    summary: '成就摘要',
    completed: '已完成',
  },
  'zh-TW': {
    title: '用戶成就',
    description: '跟蹤您在Avalon Game中的成就和進度',
    openAchievements: '公開成就',
    hiddenAchievements: '隱藏成就',
    summary: '成就摘要',
    completed: '已完成',
  },
};

export default userAchievements;
