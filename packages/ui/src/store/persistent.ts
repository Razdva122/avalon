import { userStoragePath, userProfilePath, alertStoragePath, userSettingsPath } from '@/store/const';
import type { IUser, IUserSettings, TAlerts } from '@/store/interface';
import { updateAuthToken } from '@/api/socket';

export function updateUserProfile(user: IUser) {
  localStorage.setItem(userProfilePath, JSON.stringify(user));
  updateAuthToken();
}

export function updateUserSettings(settings: IUserSettings) {
  localStorage.setItem(userSettingsPath, JSON.stringify(settings));
}

export function clearUserOldStorage() {
  localStorage.removeItem(userStoragePath);
}

export function clearUserProfile() {
  localStorage.removeItem(userProfilePath);
  updateAuthToken();
}

export function updateUserAlertsData(alerts: TAlerts) {
  localStorage.setItem(alertStoragePath, JSON.stringify(alerts));
}
