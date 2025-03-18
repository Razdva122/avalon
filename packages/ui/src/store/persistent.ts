import { userProfilePath, alertStoragePath, userSettingsPath } from '@/store/const';
import type { IUserSettings, TAlerts } from '@/store/interface';
import { updateAuthToken } from '@/api/socket';
import type { UserWithToken } from '@avalon/types';

export function updateUserProfile(user: UserWithToken, options: { updateToken: boolean }) {
  localStorage.setItem(userProfilePath, JSON.stringify(user));

  if (options.updateToken) {
    updateAuthToken();
  }
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
