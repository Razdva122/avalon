import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { updateUserData, clearUserData, updateUserAlertsData } from '@/store/persistent';
import { userStoragePath } from '@/store/const';
import type { IState, IUser, TAlertsName } from '@/store/interface';

import { userInStorage, alertsInStorage } from '@/store/init';

export * from '@/store/interface';

import { socket } from '@/api/socket';

export const key: InjectionKey<Store<IState>> = Symbol();

export const store = createStore<IState>({
  state: {
    user: userInStorage ? JSON.parse(userInStorage) : null,
    hideSpoilers: false,
    connect: null,
    alerts: alertsInStorage ? JSON.parse(alertsInStorage) : {},
  },
  getters: {},
  mutations: {
    updateAlertCounter(state: IState, alert: TAlertsName) {
      state.alerts[alert] = (state.alerts[alert] ?? 0) + 1;
      updateUserAlertsData(state.alerts);
    },

    setUserData(state: IState, user: IUser) {
      state.user = user;
      updateUserData(user);
    },

    updateUserName(state: IState, name: string) {
      if (state.user) {
        state.user.name = name;
        updateUserData(state.user);
      }
    },

    updateUserSettings<T extends keyof IUser['settings']>(
      state: IState,
      { key, value }: { key: T; value: IUser['settings'][T] },
    ) {
      if (state.user) {
        state.user.settings = state.user.settings || {};
        state.user.settings[key] = value;
        updateUserData(state.user, false);
      }
    },

    clearUserData() {
      localStorage.removeItem(userStoragePath);
      clearUserData();
    },

    updateConnectState(state: IState, value: boolean) {
      state.connect = value;
    },

    updateHideSpoilers(state: IState, value: boolean) {
      state.hideSpoilers = value;
    },
  },
  actions: {},
  modules: {},
});

socket.on('connect', () => {
  store.commit('updateConnectState', true);
});

socket.on('disconnect', () => {
  store.commit('updateConnectState', false);
});

export function useStore() {
  return baseUseStore(key);
}
