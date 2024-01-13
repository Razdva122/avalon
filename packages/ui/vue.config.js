/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/assets/scss/main.scss";
        `,
      },
    },
  },
  configureWebpack: () => {
    return {
      plugins: [
        new webpack.DefinePlugin({
          APP_VERSION: JSON.stringify(require('./package.json').version),
        }),
      ],
    };
  },
});
