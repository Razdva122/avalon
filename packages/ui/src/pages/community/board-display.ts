export const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

export const languageFlags: Record<string, string> = {
  other: '🌐',
  en: '🇬🇧',
  ru: '🇷🇺',
  es: '🇪🇸',
  pt: '🇧🇷',
  cmn: '🇨🇳 🇹🇼',
  yue: '🇭🇰',
};
