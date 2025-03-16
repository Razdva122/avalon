import { userProfilePath, alertStoragePath, userSettingsPath } from '@/store/const';
import type { IUserProfile, IUserSettings, TAlerts } from '@/store/interface';
import { updateAuthToken } from '@/api/socket';

export function updateUserProfile(user: IUserProfile) {
  localStorage.setItem(userProfilePath, JSON.stringify(user));
  updateAuthToken();
}

export function updateUserSettings(settings: IUserSettings) {
  localStorage.setItem(userSettingsPath, JSON.stringify(settings));
}

export function clearUserProfile() {
  localStorage.removeItem(userProfilePath);
  updateAuthToken();
}

export function updateUserAlertsData(alerts: TAlerts) {
  localStorage.setItem(alertStoragePath, JSON.stringify(alerts));
}
