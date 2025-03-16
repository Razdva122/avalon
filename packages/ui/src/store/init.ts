import { alertStoragePath, userProfilePath, userSettingsPath } from '@/store/const';

export const userProfileInStorage = localStorage.getItem(userProfilePath);
export const userSettingsInStorage = localStorage.getItem(userSettingsPath);
export const alertsInStorage = localStorage.getItem(alertStoragePath);
