const languages = ['en', 'ru', 'zh-TW', 'zh-CN', 'es', 'pt'];

function normalizeLanguage(value) {
  return typeof value === 'string'
    ? languages.find((language) => language.toLowerCase() === value.toLowerCase())
    : undefined;
}

function browserLanguage(value) {
  if (typeof value !== 'string') return undefined;
  const parts = value.toLowerCase().replace(/_/g, '-').split('-');
  if (parts[0] === 'zh') {
    if (parts.includes('hant')) return 'zh-TW';
    if (parts.includes('hans')) return 'zh-CN';
    return parts.some((part) => ['tw', 'hk', 'mo'].includes(part)) ? 'zh-TW' : 'zh-CN';
  }
  return normalizeLanguage(parts[0]);
}

function preferredLanguage(settings, browserLanguages = []) {
  const saved = settings?.locale?.isDefault === false && normalizeLanguage(settings.locale.value);
  if (saved) return saved;
  for (const language of browserLanguages) {
    const supported = browserLanguage(language);
    if (supported) return supported;
  }
  return 'en';
}

function pageLanguage(pathname, isNeutral, preferred) {
  if (isNeutral) return normalizeLanguage(preferred) || 'en';
  return normalizeLanguage(pathname.split('/')[1]) || 'en';
}

function parseStoredObject(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

module.exports = { languages, normalizeLanguage, preferredLanguage, pageLanguage, parseStoredObject };
