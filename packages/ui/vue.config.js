/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const CopyPlugin = require('copy-webpack-plugin');
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin');
const { VuetifyPlugin } = require('webpack-plugin-vuetify');
const { routesSeo } = require('./src/router/seo');
const { yaMetrika, gtag } = require('./const');

const multiLangRoutes = Object.values(routesSeo).reduce((acc, el) => {
  if (el.meta.multiLanguage) {
    acc.push(
      ...Object.keys(el.meta.multiLanguage).map((lang) => {
        return {
          ...el,
          path: `/${lang}${el.path}`.toLowerCase(),
        };
      }),
      {
        ...el,
      },
    );
  } else {
    acc.push(el);
  }

  return acc;
}, []);

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
            lastmod: true,
            changefreq: 'weekly',
            priority: 0.8,
          },
        }),
        new CopyPlugin({
          patterns: [
            {
              from: 'src/assets',
              to: 'static',
            },
          ],
        }),
        new PrerendererWebpackPlugin({
          routes: multiLangRoutes.filter((el) => el.meta.prerender).map((el) => el.path),
        }),
      ],
    };
  },
});
