const fs = require('node:fs');
const path = require('node:path');
const ui = path.resolve(__dirname, '..');
require('ts-node').register({
  project: path.join(ui, 'tsconfig.json'),
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});
require('tsconfig-paths').register({ baseUrl: ui, paths: { '@/*': ['src/*'] } });

// Page translation source files group all languages together. Resolve those
// groups at build time so a visitor downloads only the chosen dictionary.
const output = path.join(ui, 'src/i18n/generated');
fs.mkdirSync(output, { recursive: true });
for (const [language, moduleName] of Object.entries({
  en: 'en',
  ru: 'ru',
  es: 'es',
  pt: 'pt',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
})) {
  const messages = require(path.join(ui, 'src/i18n/langs', moduleName))[moduleName];
  fs.writeFileSync(path.join(output, `${language}.json`), JSON.stringify(messages));
}
console.log('Generated six independent locale dictionaries.');
