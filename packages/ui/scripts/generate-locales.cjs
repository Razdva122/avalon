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
const wikiNamespaces = new Set([
  'lancelots',
  'lady',
  'ladySea',
  'excalibur',
  'plotCards',
  'morgana',
  'percival',
  'rules',
  'lovers',
  'merlin',
  'oberon',
  'mordred',
  'troublemaker',
  'trickster',
  'witch',
  'brute',
  'lunatic',
  'guinevere',
  'merlinPure',
  'minion',
  'servant',
  'cleric',
  'revealer',
]);
const trapperNamespaces = new Set(['trapperGuide']);
const output = path.join(ui, 'src/i18n/generated');
fs.mkdirSync(output, { recursive: true });
for (const [language, moduleName] of Object.entries({
  en: 'en',
  ru: 'ru',
  es: 'es',
  pt: 'pt',
  vi: 'vi',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
})) {
  const messages = require(path.join(ui, 'src/i18n/langs', moduleName))[moduleName];
  const entries = Object.entries(messages);
  for (const prefix of ['', 'wiki-', 'trapper-']) {
    const target = path.join(output, `${prefix}${language}.json`);
    const content = JSON.stringify(
      Object.fromEntries(
        entries.filter(([key]) =>
          prefix === 'wiki-'
            ? wikiNamespaces.has(key)
            : prefix === 'trapper-'
              ? trapperNamespaces.has(key)
              : !wikiNamespaces.has(key) && !trapperNamespaces.has(key),
        ),
      ),
    );
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) fs.writeFileSync(target, content);
  }
}
console.log('Generated common, wiki and page-specific Trapper dictionaries for seven languages.');
