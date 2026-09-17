// Webpack emits separate, content-hashed files; the context contains URLs, not image bytes.
const images = require.context('@/assets/images', true, /\.(webp|png)$/);
const icons = require.context('@/assets/icons', true, /\.webp$/);

export const getImagePath = (path: string): string => images(`./${path}`);

export const getImagePathByID = (
  type: 'roles' | 'roles/legacy' | 'roles/anime' | 'features' | 'core' | 'other' | 'premium' | 'stickers',
  id: string,
): string => getImagePath(`${type}/${id}.${type === 'premium' || type === 'stickers' ? 'png' : 'webp'}`);

export const getIconPathByName = (name: string): string => icons(`./${name}.webp`);
