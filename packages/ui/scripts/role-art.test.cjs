const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const { createStore } = require('vuex');
const { computed } = require('vue');

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
const { calculateRoleUrl, calculateRolePortraitStyle, calculateRoleIconStyle } = load(
  'helpers/styles/index.ts',
  (id) => {
    if (id === '@/helpers/images') return images;
    if (id === '@/store') return { store };
    if (id === './role-framing') return load('helpers/styles/role-framing.ts', require);
    return require(id);
  },
);
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

test('classic cards use classic artwork for every playable role', () => {
  store.state.settings = { style: 'legacy' };
  for (const [role, file] of [
    ['merlin', 'roles/legacy/merlin.webp'],
    ['servant', 'roles/legacy/servant.webp'],
    ['percival', 'roles/legacy/percival.webp'],
    ['minion', 'roles/legacy/minion.webp'],
    ['mordred', 'roles/legacy/mordred.webp'],
    ['morgana', 'roles/legacy/morgana.webp'],
    ['oberon', 'roles/legacy/oberon.webp'],
    ['merlinPure', 'roles/legacy/merlin_pure.webp'],
    ['guinevere', 'roles/legacy/guinevere.webp'],
    ['tristan', 'roles/legacy/tristan.webp'],
    ['isolde', 'roles/legacy/isolde.webp'],
    ['goodLancelot', 'roles/legacy/good_lancelot.webp'],
    ['evilLancelot', 'roles/legacy/evil_lancelot.webp'],
    ['troublemaker', 'roles/legacy/troublemaker.webp'],
    ['cleric', 'roles/legacy/cleric.webp'],
    ['trickster', 'roles/legacy/trickster.webp'],
    ['lunatic', 'roles/legacy/lunatic.webp'],
    ['brute', 'roles/legacy/brute.webp'],
    ['witch', 'roles/legacy/witch.webp'],
    ['revealer', 'roles/legacy/revealer.webp'],
    ['wraith', 'roles/legacy/wraith.webp'],
    ['unknownLancelot', 'roles/legacy/unknown_lancelot.webp'],
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

test('every role asset, including mystery and reveal variants, resolves in all three styles', () => {
  const camelCase = require('lodash/camelCase');
  const files = fs.readdirSync(path.join(src, 'assets/images/roles')).filter((file) => file.endsWith('.webp'));
  for (const style of ['default', 'legacy', 'anime']) {
    store.state.settings = { style };
    const folder = style === 'default' ? 'roles' : `roles/${style}`;
    for (const file of files) {
      const id = file.slice(0, -5);
      const role = id === 'mystery' ? 'mysteryWizard' : id.startsWith('revealer_') ? id : camelCase(id);
      assert.equal(calculateRoleUrl(role), artwork(`${folder}/${file}`));
      const portrait = calculateRolePortraitStyle(role);
      assert.ok(Number(portrait['--role-image-scale']) >= 1, `${style}/${role} must fill its frame`);
      const icon = calculateRoleIconStyle(role, false);
      const thumbnail = calculateRoleIconStyle(role, true);
      assert.equal(icon.backgroundImage, `url("${artwork(`${folder}/${file}`)}")`);
      assert.equal(
        thumbnail.backgroundImage,
        `url("${pathToFileURL(path.join(src, 'assets/thumbnails', folder, file)).href}")`,
      );
      assert.equal(icon.backgroundPosition, thumbnail.backgroundPosition);
      assert.equal(icon.backgroundSize, thumbnail.backgroundSize);
    }
  }
});

test('portrait and game crops react to preference changes and leave non-role icons alone', () => {
  store.state.settings = null;
  const portrait = computed(() => calculateRolePortraitStyle('merlin'));
  const icon = computed(() => calculateRoleIconStyle('merlin', true));
  const initialPortrait = portrait.value;
  const initialIcon = icon.value;
  store.state.settings = { style: 'legacy' };
  assert.notDeepEqual(portrait.value, initialPortrait);
  assert.notDeepEqual(icon.value, initialIcon);
  for (const role of ['good', 'evil', 'unknown', 'excalibur']) {
    assert.deepEqual(calculateRoleIconStyle(role, false), {});
    assert.deepEqual(calculateRolePortraitStyle(role), {});
  }
});
