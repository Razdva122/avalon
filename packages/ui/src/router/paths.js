// Shared by the client router, prerenderer and sitemap generator.
const localePrefix = /^\/(en|ru|zh-tw|zh-cn|es|pt)(?=\/|$)/i;

function basePath(path) {
  const withoutLocale = path.replace(localePrefix, '') || '/';
  return withoutLocale.endsWith('/') ? withoutLocale : `${withoutLocale}/`;
}

function localizedPath(path, language) {
  const prefix = language.toLowerCase() === 'en' ? '' : `/${language.toLowerCase()}`;
  return prefix + basePath(path);
}

function isNeutralPath(path) {
  return /^\/(?:support|profile|leaderboard|achievements\/global|room\/[^/]+|stats\/user\/[^/]+|achievements\/user\/[^/]+)\/$/.test(
    basePath(path),
  );
}

function neutralRoomUrl(url) {
  const result = new URL(url);
  result.pathname = basePath(result.pathname);
  return result.href;
}

module.exports = { basePath, localizedPath, isNeutralPath, neutralRoomUrl };
