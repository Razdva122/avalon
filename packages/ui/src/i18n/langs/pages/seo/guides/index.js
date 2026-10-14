// SEO metadata stays small and separate from lazy-loaded article bodies.
const locales = {
  en: require('./en'),
  ru: require('./ru'),
  es: require('./es'),
  pt: require('./pt'),
  'zh-CN': require('./zh-CN'),
  'zh-TW': require('./zh-TW'),
};
module.exports = Object.fromEntries(
  Object.keys(locales.en).map((id) => [
    id,
    Object.fromEntries(Object.entries(locales).map(([language, pages]) => [language, pages[id]])),
  ]),
);
