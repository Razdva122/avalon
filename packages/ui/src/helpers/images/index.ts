// Webpack emits separate, content-hashed files; the context contains URLs, not image bytes.
const images = require.context('@/assets/images', true, /\.webp$/);
const avatars = require.context('@/assets/avatars', true, /\.webp$/);
const icons = require.context('@/assets/icons', true, /\.webp$/);

export const getImagePath = (path: string): string => images(`./${path}`);

export const getImagePathByID = (
  type: 'roles' | 'roles/legacy' | 'roles/anime' | 'features' | 'core' | 'other' | 'premium' | 'stickers',
  id: string,
): string => getImagePath(`${type}/${id}.webp`);

export const getIconPathByName = (name: string): string => icons(`./${name}.webp`);

// A shared small image for profile, player, donor and avatar-picker previews.
export const getAvatarPathByID = (type: 'roles' | 'features' | 'core' | 'premium', id: string): string =>
  avatars(`./${type}/${id}.webp`);
