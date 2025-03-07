import { userStoragePath, alertStoragePath, userProfilePath, userSettingsPath } from '@/store/const';

export const userInStorage = localStorage.getItem(userStoragePath);

if (userInStorage) {
  const userData = JSON.parse(userInStorage);

  if (userData.settings && !localStorage.getItem(userSettingsPath)) {
    localStorage.setItem(userSettingsPath, JSON.stringify(userData.settings));
  }
}

export const userProfileInStorage = localStorage.getItem(userProfilePath);
export const userSettingsInStorage = localStorage.getItem(userSettingsPath);
export const alertsInStorage = localStorage.getItem(alertStoragePath);
