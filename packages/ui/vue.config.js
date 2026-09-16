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
            renderAfterElementExists: 'h1',
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
