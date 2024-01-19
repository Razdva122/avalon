import { updateUserData } from '@/store/persistent';
import { userStoragePath } from '@/store/const';

export const userInStorage = localStorage.getItem(userStoragePath);

if (userInStorage) {
  updateUserData(JSON.parse(userInStorage));
}
