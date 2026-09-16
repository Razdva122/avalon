import { store } from '@/store';
import { normalizeLanguage } from './policy';

// Visiting a translated page does not change the player's preference.
// Only an explicit choice in the menu, suggestion or profile is remembered.
export function rememberLanguage(value: string) {
  const language = normalizeLanguage(value);
  if (language) store.commit('updateUserSettings', { key: 'locale', value: { value: language, isDefault: false } });
  return language;
}

export async function chooseLanguage(value: string) {
  const language = normalizeLanguage(value);
  if (!language) return;
  const { setLanguage, i18n } = await import('@/plugins/i18n');
  try {
    if (await setLanguage(language)) rememberLanguage(language);
  } catch {
    const { default: eventBus } = await import('@/helpers/event-bus');
    eventBus.emit('infoMessage', i18n.global.t('stickers.failed'));
  }
}
