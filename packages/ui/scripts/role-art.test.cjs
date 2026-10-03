const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const { createStore } = require('vuex');

const src = path.resolve(__dirname, '../src');

function load(file, resolve) {
  const source = fs.readFileSync(path.join(src, file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
  return module.exports;
}

// Webpack's only browser-specific boundary: resolve real files, and reject absent skins.
const webpackRequire = (id) => require(id);
webpackRequire.context = (request, _recursive, pattern) => {
  const directory = path.join(src, request.replace('@/', ''));
  return (key) => {
    const file = path.join(directory, key);
    assert.ok(pattern.test(key), `Unexpected image extension: ${key}`);
    assert.ok(fs.statSync(file).isFile(), `Missing artwork: ${file}`);
    return pathToFileURL(file).href;
  };
};
const images = load('helpers/images/index.ts', webpackRequire);
const store = createStore({ state: { settings: null } });
const { calculateRoleUrl } = load('helpers/styles/index.ts', (id) => {
  if (id === '@/helpers/images') return images;
  if (id === '@/store') return { store };
  return require(id);
});
const artwork = (file) => pathToFileURL(path.join(src, 'assets/images', file)).href;

test('role cards use default artwork when no preference or default style is selected', () => {
  for (const settings of [null, { style: 'default' }]) {
    store.state.settings = settings;
    for (const [role, file] of [
      ['merlin', 'roles/merlin.webp'],
      ['servant', 'roles/servant.webp'],
      ['merlinPure', 'roles/merlin_pure.webp'],
      ['guinevere', 'roles/guinevere.webp'],
    ])
      assert.equal(calculateRoleUrl(role), artwork(file), role);
  }
});

test('classic cards use available skins and preserve default Pure Merlin and Guinevere artwork', () => {
  store.state.settings = { style: 'legacy' };
  for (const [role, file] of [
    ['merlin', 'roles/legacy/merlin.webp'],
    ['servant', 'roles/legacy/servant.webp'],
    ['percival', 'roles/legacy/percival.webp'],
    ['minion', 'roles/legacy/minion.webp'],
    ['mordred', 'roles/legacy/mordred.webp'],
    ['morgana', 'roles/legacy/morgana.webp'],
    ['oberon', 'roles/legacy/oberon.webp'],
    ['merlinPure', 'roles/merlin_pure.webp'],
    ['guinevere', 'roles/guinevere.webp'],
  ])
    assert.equal(calculateRoleUrl(role), artwork(file), role);
});

test('anime cards use the chosen artwork, including Pure Merlin and Guinevere', () => {
  store.state.settings = { style: 'anime' };
  for (const [role, file] of [
    ['merlin', 'roles/anime/merlin.webp'],
    ['servant', 'roles/anime/servant.webp'],
    ['merlinPure', 'roles/anime/merlin_pure.webp'],
    ['guinevere', 'roles/anime/guinevere.webp'],
    ['goodLancelot', 'roles/anime/good_lancelot.webp'],
  ])
    assert.equal(calculateRoleUrl(role), artwork(file), role);
});
