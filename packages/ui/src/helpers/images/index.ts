export const s3ImagesPath = 'https://storage.yandexcloud.net/avalon-game/images/';
export const s3IconsPath = 'https://storage.yandexcloud.net/avalon-game/icons/';

export const getImagePathByID = (type: 'roles' | 'roles/anime' | 'features' | 'core' | 'other', id: string): string => {
  return s3ImagesPath + type + '/' + id + '.webp';
};

export const getIconPathByName = (name: string): string => {
  return s3IconsPath + name + '.webp';
};
