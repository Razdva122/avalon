import { store } from '@/store';
import { OPEN_ACHIEVEMENT_IDS } from '@avalon/types';

export function getAchievementsText(achievementID: string, text: string): string {
  if (OPEN_ACHIEVEMENT_IDS.includes(achievementID) || store.state.profile?.knownAchievements?.includes(achievementID)) {
    return text;
  }

  return '???';
}
