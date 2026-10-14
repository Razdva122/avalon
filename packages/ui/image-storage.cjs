// Every release includes its images in the UI container, served by nginx.
function imageGenerator() {
  return {
    filename: 'img/[name].[contenthash:16][ext]',
    publicPath: '/',
  };
}

module.exports = { imageGenerator };
