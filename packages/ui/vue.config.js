/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');
const { VuetifyPlugin } = require('webpack-plugin-vuetify');
const { routesSeo } = require('./src/router/seo');
const { yaMetrika, gtag } = require('./const');

const { localizedPath } = require('./src/router/paths');

const multiLangRoutes = Object.values(routesSeo).flatMap((route) =>
  Object.keys(route.meta.multiLanguage).map((language) => ({
    ...route,
    path: localizedPath(route.path, language),
  })),
);

const paths = multiLangRoutes.filter((el) => !el.meta.skipSiteMap);

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/helpers/scss/main.scss";
        `,
      },
    },
  },
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      const templateFunc = args[0].templateParameters;

      args[0].templateParameters = (...args) => {
        return {
          ...templateFunc(...args),
          yaMetrika: process.env.NODE_ENV !== 'production' ? '' : yaMetrika,
          gtag: process.env.NODE_ENV !== 'production' ? '' : gtag,
        };
      };

      return args;
    });
  },
  configureWebpack: () => {
    if (process.env.NODE_ENV !== 'production') {
      return {
        plugins: [
          new webpack.DefinePlugin({
            APP_VERSION: "'DEV'",
          }),
          new VuetifyPlugin(),
        ],
      };
    }

    return {
      plugins: [
        new webpack.DefinePlugin({
          APP_VERSION: JSON.stringify(require('./package.json').version),
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
        }),
        new VuetifyPlugin(),
        new SitemapPlugin({
          base: 'https://avalon-game.com/',
          paths,
          options: {
            filename: 'sitemap.xml',
            skipgzip: true,
            changefreq: 'weekly',
            priority: 0.8,
          },
        }),
        new PrerendererWebpackPlugin({
          routes: multiLangRoutes.filter((el) => el.meta.prerender).map((el) => el.path),
          renderer: new PuppeteerRenderer({
            timeout: 30000,
            maxConcurrentRoutes: 4,
            // Analytics and remote images are not needed to prerender text and metadata.
            skipThirdPartyRequests: true,
            // renderer-puppeteer 1.2.x races the selector against an unreferenced
            // browser Promise, which Chrome can collect. Await readiness directly.
            pageSetup: (page, route) => {
              page.prerenderErrors = [];
              page.on('pageerror', (error) => page.prerenderErrors.push(error.message));
              page.on('console', (message) => {
                if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
                  page.prerenderErrors.push(message.text());
                }
              });
            },
            pageHandler: async (page, route) => {
              try {
                await page.waitForSelector('#app[data-prerender-ready] h1, #app[data-prerender-error]', {
                  timeout: 30000,
                });
                const error = await page.$eval('#app', (root) => root.dataset.prerenderError);
                if (error) throw new Error(error);
                // Avoid a second waterfall for the selected locale and fallback.
                await page.evaluate(() => {
                  for (const resource of performance.getEntriesByType('resource')) {
                    const url = new URL(resource.name);
                    if (url.origin !== location.origin || !/^\/js\/locale-[^/]+\.js$/.test(url.pathname)) continue;
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'script';
                    link.href = url.pathname;
                    document.head.appendChild(link);
                  }
                });
              } catch (error) {
                const state = await page
                  .$eval('#app', (root) => ({
                    ready: root.dataset.prerenderReady,
                    error: root.dataset.prerenderError,
                    heading: root.querySelector('h1')?.textContent,
                  }))
                  .catch(() => null);
                throw new Error(
                  `Prerender failed for ${route}: ${error.message}; state=${JSON.stringify(state)}; errors=${page.prerenderErrors.join('; ')}`,
                );
              }
            },
            injectProperty: '__AVALON_PRERENDER__',
            inject: { prerender: true },
            // Permit the same build on developer machines and in the Docker image.
            ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
          }),
        }),
      ],
    };
  },
});
