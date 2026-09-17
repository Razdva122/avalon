// Shared by Webpack, the release audit and the uploader. Never put credentials here.
const storage = Object.freeze({
  endpoint: 'https://storage.yandexcloud.net',
  bucket: 'avalon-game',
  prefix: 'assets/',
  region: 'ru-central1',
  cacheControl: 'public, max-age=31536000, immutable',
});
const publicBase = `${storage.endpoint}/${storage.bucket}/${storage.prefix}`;

function imageGenerator(env = process.env) {
  const source = env.AVALON_IMAGE_SOURCE || (env.NODE_ENV === 'production' ? 'cloud' : 'local');
  if (!['cloud', 'local'].includes(source)) throw new Error('AVALON_IMAGE_SOURCE must be cloud or local');
  return {
    filename: 'img/[name].[contenthash:16][ext]',
    publicPath: source === 'cloud' ? publicBase : '/',
  };
}

module.exports = { storage, publicBase, imageGenerator };
