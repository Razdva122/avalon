import { store } from '@/store';
import { normalizeLanguage } from './policy';

// Visiting a translated page does not change the player's preference.
// Only an explicit choice in the menu, suggestion or profile is remembered.
export function rememberLanguage(value: string) {
  const language = normalizeLanguage(value);
  if (language) store.commit('updateUserSettings', { key: 'locale', value: { value: language, isDefault: false } });
  return language;
}
