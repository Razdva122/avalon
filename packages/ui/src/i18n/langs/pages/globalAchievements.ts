import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const globalAchievements: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    title: 'Global Achievements',
    description: 'View global achievement statistics in Avalon Game',
    openAchievements: 'Open Achievements',
    hiddenAchievements: 'Hidden Achievements',
    globalSummary: 'Global Achievement Statistics',
    totalUsers: 'Total Players',
    globalCompletion: '{percentage}% of players have unlocked this achievement',
  },
  ru: {
    title: 'Глобальные достижения',
    description: 'Просмотр глобальной статистики достижений в Avalon Game',
    openAchievements: 'Открытые достижения',
    hiddenAchievements: 'Скрытые достижения',
    globalSummary: 'Глобальная статистика достижений',
    totalUsers: 'Всего игроков',
    globalCompletion: '{percentage}% игроков разблокировали это достижение',
  },
  es: {
    title: 'Logros globales',
    description: 'Ver estadísticas de logros globales en Avalon Game',
    openAchievements: 'Logros abiertos',
    hiddenAchievements: 'Logros ocultos',
    globalSummary: 'Estadísticas de logros globales',
    totalUsers: 'Jugadores totales',
    globalCompletion: '{percentage}% de los jugadores han desbloqueado este logro',
  },
  pt: {
    title: 'Conquistas globais',
    description: 'Ver estatísticas de conquistas globais no Avalon Game',
    openAchievements: 'Conquistas abertas',
    hiddenAchievements: 'Conquistas ocultas',
    globalSummary: 'Estatísticas de conquistas globais',
    totalUsers: 'Total de jogadores',
    globalCompletion: '{percentage}% dos jogadores desbloquearam esta conquista',
  },
  'zh-CN': {
    title: '全球成就',
    description: '查看Avalon Game中的全球成就统计',
    openAchievements: '公开成就',
    hiddenAchievements: '隐藏成就',
    globalSummary: '全球成就统计',
    totalUsers: '总玩家数',
    globalCompletion: '{percentage}%的玩家已解锁此成就',
  },
  'zh-TW': {
    title: '全球成就',
    description: '查看Avalon Game中的全球成就統計',
    openAchievements: '公開成就',
    hiddenAchievements: '隱藏成就',
    globalSummary: '全球成就統計',
    totalUsers: '總玩家數',
    globalCompletion: '{percentage}%的玩家已解鎖此成就',
  },
};

export default globalAchievements;
