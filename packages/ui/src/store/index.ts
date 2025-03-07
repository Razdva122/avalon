import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { v4 as uuidv4 } from 'uuid';

import {
  updateUserProfile,
  updateUserAlertsData,
  clearUserProfile,
  updateUserSettings,
  clearUserOldStorage,
} from '@/store/persistent';
import type { IState, TAlertsName, IUserSettings, IUserProfile } from '@/store/interface';

import { userInStorage, alertsInStorage, userProfileInStorage, userSettingsInStorage } from '@/store/init';

export * from '@/store/interface';

import { socket } from '@/api/socket';

export const key: InjectionKey<Store<IState>> = Symbol();

export const store = createStore<IState>({
  state: {
    user: userInStorage ? JSON.parse(userInStorage) : null,
    profile: userProfileInStorage ? JSON.parse(userProfileInStorage) : null,
    settings: userSettingsInStorage ? JSON.parse(userSettingsInStorage) : null,
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

    updateUserProfile(state: IState, profile: IUserProfile) {
      state.profile = profile;
      updateUserProfile(profile);
    },

    updateUserSettings<T extends keyof IUserSettings>(
      state: IState,
      { key, value }: { key: T; value: IUserSettings[T] },
    ) {
      if (!state.settings) {
        state.settings = {};
      }

      state.settings[key] = value;
      updateUserSettings(state.settings);
    },

    clearUserProfile(state: IState) {
      state.profile = null;
      clearUserProfile();
    },

    updateConnectState(state: IState, value: boolean) {
      state.connect = value;
    },

    updateHideSpoilers(state: IState, value: boolean) {
      state.hideSpoilers = value;
    },
  },
  actions: {
    async login({ commit }, { email, password }): Promise<void> {
      const user = await socket.emitWithAck('login', email, password);
      commit('updateUserProfile', user);
    },
    async registerUser({ commit, state }, { password, name, email }): Promise<void> {
      let id = uuidv4();

      if (state.user?.id) {
        id = state.user?.id;
      }

      const user = await socket.emitWithAck('registerUser', {
        password,
        id,
        name,
        email,
      });

      if (state.user) {
        clearUserOldStorage();
      }

      commit('updateUserProfile', user);
    },
    updateUserPassword({ state }, { password, newPassword }): void {
      if (state.profile) {
        socket.emitWithAck('updateUserPassword', password, newPassword);
      }
    },
    updateUserName({ commit, state }, { name }): void {
      if (state.profile) {
        socket.emit('updateUserName', name);
        commit('updateUserProfile', { ...state.profile, name });
      }
    },
    async updateUserEmail({ commit, state }, { email, password }): Promise<void> {
      if (state.profile) {
        const result = await socket.emitWithAck('updateUserEmail', email, password);

        if (result) {
          commit('updateUserProfile', { ...state.profile, email });
        }
      }
    },
  },
  modules: {},
});

socket.on('connect', () => {
  store.commit('updateConnectState', true);
});

socket.on('disconnect', () => {
  store.commit('updateConnectState', false);
});

socket.on('renewJWT', () => {
  store.commit('clearUserProfile');
});

export function useStore() {
  return baseUseStore(key);
}
