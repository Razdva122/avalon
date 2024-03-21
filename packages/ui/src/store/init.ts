import { updateUserData } from '@/store/persistent';
import { userStoragePath, alertStoragePath } from '@/store/const';

export const userInStorage = localStorage.getItem(userStoragePath);
export const alertsInStorage = localStorage.getItem(alertStoragePath);

if (userInStorage) {
  updateUserData(JSON.parse(userInStorage));
}
