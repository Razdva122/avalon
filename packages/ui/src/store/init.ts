import { alertStoragePath, userProfilePath, userSettingsPath } from '@/store/const';

import { parseStoredObject } from '@/helpers/i18n/policy';

export function readStoredObject(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return parseStoredObject(value) ? value : null;
  } catch {
    return null;
  }
}

export const userProfileInStorage = readStoredObject(userProfilePath);
export const userSettingsInStorage = readStoredObject(userSettingsPath);
export const alertsInStorage = readStoredObject(alertStoragePath);
