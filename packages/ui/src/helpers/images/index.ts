export const s3ImagesPath = 'https://storage.yandexcloud.net/avalon-game/images/';

export const getImagePathByID = (type: 'roles' | 'roles/anime' | 'features', id: string): string => {
  return s3ImagesPath + type + '/' + id + '.webp';
};
