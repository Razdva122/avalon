import { userStoragePath, alertStoragePath } from '@/store/const';
import type { IUser, TAlerts } from '@/store/interface';
import Cookies from 'js-cookie';

export function updateUserData(user: IUser) {
  localStorage.setItem(userStoragePath, JSON.stringify(user));
  Cookies.remove('user_id');
  Cookies.remove('user_name');
  Cookies.set('user_id', user.id);
  Cookies.set('user_name', user.name);
}

export function clearUserData() {
  localStorage.removeItem(userStoragePath);
  Cookies.remove('user_id');
  Cookies.remove('user_name');
}

export function updateUserAlertsData(alerts: TAlerts) {
  localStorage.setItem(alertStoragePath, JSON.stringify(alerts));
}
