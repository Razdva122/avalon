const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const webpack = require('webpack');
const ts = require('typescript');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { imageGenerator } = require('../image-storage.cjs');
const ui = path.resolve(__dirname, '..');

test('only production defaults to cloud; explicit local builds work and typos fail', () => {
  assert.equal(
    imageGenerator({ NODE_ENV: 'production' }).publicPath,
    'https://storage.yandexcloud.net/avalon-game/assets/',
  );
  assert.equal(imageGenerator({ NODE_ENV: 'development' }).publicPath, '/');
  assert.equal(imageGenerator({ NODE_ENV: 'production', AVALON_IMAGE_SOURCE: 'local' }).publicPath, '/');
  assert.throws(() => imageGenerator({ AVALON_IMAGE_SOURCE: 'cluod' }), /AVALON_IMAGE_SOURCE/);
});

for (const mode of ['cloud', 'local']) {
  test(`real helpers, SCSS and Open Graph use the same emitted files in ${mode} mode`, async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avalon-images-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const out = path.join(dir, 'out');
    const generator = imageGenerator({ AVALON_IMAGE_SOURCE: mode });
    fs.writeFileSync(
      path.join(dir, 'entry.js'),
      ts.transpileModule(fs.readFileSync(path.join(ui, 'src/helpers/images/index.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText + "\nrequire('./fixture.scss');\n",
    );
    fs.writeFileSync(
      path.join(dir, 'fixture.scss'),
      `@import '${ui}/src/helpers/scss/main.scss';\n.role { background: getImagePathByID('roles', 'merlin'); }\n.icon { background: getIconPathByName('merlin_hat'); }`,
    );
    const compiler = webpack({
      mode: 'production',
      target: 'node',
      context: ui,
      entry: path.join(dir, 'entry.js'),
      output: { path: out, filename: 'bundle.cjs', publicPath: '/', library: { type: 'commonjs2' } },
      resolve: { alias: { '@': path.join(ui, 'src') } },
      module: {
        rules: [
          { test: /\.(png|webp)$/, type: 'asset/resource', generator },
          {
            test: /\.scss$/,
            use: [MiniCssExtractPlugin.loader, require.resolve('css-loader'), require.resolve('sass-loader')],
          },
        ],
      },
      plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
          template: path.join(ui, 'public/index.html'),
          templateParameters: {
            BASE_URL: '/',
            yaMetrika: '',
            gtag: '',
            absoluteImageUrl: (url) => new URL(url, 'https://avalon-game.com').href,
            imageStorageOrigin: mode === 'cloud' ? 'https://storage.yandexcloud.net' : '',
          },
        }),
      ],
      performance: false,
    });
    await new Promise((resolve, reject) =>
      compiler.run((error, stats) => {
        compiler.close(() => {
          if (error) reject(error);
          else if (stats.hasErrors()) reject(new Error(stats.toString({ all: false, errors: true })));
          else resolve();
        });
      }),
    );
    const helpers = require(path.join(out, 'bundle.cjs'));
    const prefix = mode === 'cloud' ? 'https://storage.yandexcloud.net/avalon-game/assets/' : '/';
    const css = fs.readFileSync(path.join(out, 'main.css'), 'utf8');
    const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
    for (const url of [
      helpers.getImagePathByID('roles', 'merlin'),
      helpers.getImagePathByID('roles/anime', 'merlin'),
      helpers.getImagePathByID('premium', 'puppeteer'),
      helpers.getImagePathByID('stickers', 'morgana-violin'),
      helpers.getIconPathByName('merlin_hat'),
      helpers.getIconPathByName('plot-cards/ambush'),
    ]) {
      assert(url.startsWith(prefix), url);
      const file = url.slice(prefix.length);
      assert.match(file, /^img\/[^/]+\.[a-f0-9]{16}\.(webp|png)$/);
      assert(fs.statSync(path.join(out, file)).size > 0);
    }
    const merlin = helpers.getImagePathByID('roles', 'merlin');
    assert(css.includes(merlin));
    assert(css.includes(helpers.getIconPathByName('merlin_hat')));
    assert(html.includes(new URL(merlin, 'https://avalon-game.com').href));
    assert(!html.includes('https://avalon-game.comhttps:'));
    assert.deepEqual(
      fs.readFileSync(path.join(out, merlin.slice(prefix.length))),
      fs.readFileSync(path.join(ui, 'src/assets/images/roles/merlin.webp')),
    );
  });
}
