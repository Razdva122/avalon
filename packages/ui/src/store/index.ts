import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { v4 as uuidv4 } from 'uuid';

import { updateUserProfile, updateUserAlertsData, clearUserProfile, updateUserSettings } from '@/store/persistent';

import type { IState, TAlertsName, IUserSettings, TUserState } from '@/store/interface';

import { alertsInStorage, userProfileInStorage, userSettingsInStorage } from '@/store/init';

export * from '@/store/interface';

import { socket } from '@/api/socket';

import type { ArgumentOfCallback, UserWithToken } from '@avalon/types';

export const key: InjectionKey<Store<IState>> = Symbol();

export const store = createStore<IState>({
  state: {
    profile: userProfileInStorage ? JSON.parse(userProfileInStorage) : null,
    settings: userSettingsInStorage ? JSON.parse(userSettingsInStorage) : null,
    hideSpoilers: false,
    connect: null,
    users: {},
    alerts: alertsInStorage ? JSON.parse(alertsInStorage) : {},
  },
  getters: {},
  mutations: {
    updateAlertCounter(state: IState, alert: TAlertsName) {
      state.alerts[alert] = (state.alerts[alert] ?? 0) + 1;
      updateUserAlertsData(state.alerts);
    },

    updateUserProfile(state: IState, profile: UserWithToken) {
      const isNewToken = state.profile?.token !== profile.token;
      state.profile = profile;
      updateUserProfile(profile, { updateToken: isNewToken });
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

    updateUserAchievements(state: IState, achievementNameOrArray: string | string[]) {
      if (state.profile) {
        state.profile.knownAchievements = state.profile.knownAchievements || [];

        if (Array.isArray(achievementNameOrArray)) {
          state.profile.knownAchievements = achievementNameOrArray;
        } else if (!state.profile.knownAchievements.includes(achievementNameOrArray)) {
          state.profile.knownAchievements.push(achievementNameOrArray);
        }

        updateUserProfile(state.profile, { updateToken: false });
      }
    },

    updateHideSpoilers(state: IState, value: boolean) {
      state.hideSpoilers = value;
    },

    updateUsersState(state: IState, { uuid, user }: { uuid: string; user: TUserState }) {
      state.users[uuid] = user;
    },
  },
  actions: {
    async login({ commit }, { loginOrEmail, password }): Promise<ArgumentOfCallback<'login'>> {
      const user = await socket.emitWithAck('login', loginOrEmail, password);

      if (!('error' in user)) {
        commit('updateUserProfile', user);
      }

      return user;
    },
    async registerUser({ commit }, { password, name, email, login }): Promise<ArgumentOfCallback<'registerUser'>> {
      const id = uuidv4();

      const user = await socket.emitWithAck('registerUser', {
        password,
        id,
        name,
        email,
        login,
      });

      if (!('error' in user)) {
        commit('updateUserProfile', user);
      }

      return user;
    },
    async updateUserPassword(_state, { password, newPassword }): Promise<ArgumentOfCallback<'updateUserPassword'>> {
      const result = socket.emitWithAck('updateUserPassword', password, newPassword);
      return result;
    },
    updateUserName({ commit, state }, { name }): void {
      if (state.profile) {
        socket.emit('updateUserName', name);
        commit('updateUserProfile', { ...state.profile, name });
      }
    },
    async updateUserEmail({ commit, state }, { email, password }): Promise<ArgumentOfCallback<'updateUserEmail'>> {
      const result = await socket.emitWithAck('updateUserEmail', password, email);

      if (state.profile) {
        if (result === true) {
          commit('updateUserProfile', { ...state.profile, email });
        }
      }

      return result;
    },
    async refreshProfile({ commit, state }): Promise<ArgumentOfCallback<'getMyProfile'>> {
      const result = await socket.emitWithAck('getMyProfile');

      if (state.profile) {
        commit('updateUserProfile', { ...state.profile, ...result });
      }

      return result;
    },
    async updateUserAvatar({ commit, state }, { avatarID }): Promise<ArgumentOfCallback<'updateUserAvatar'>> {
      const result = await socket.emitWithAck('updateUserAvatar', avatarID);

      if (state.profile) {
        if (result === true) {
          commit('updateUserProfile', { ...state.profile, avatar: avatarID });
        }
      }

      return result;
    },
    async updateUserLogin({ commit, state }, { login, password }): Promise<ArgumentOfCallback<'updateUserLogin'>> {
      const result = await socket.emitWithAck('updateUserLogin', password, login);

      if (state.profile) {
        if (result === true) {
          commit('updateUserProfile', { ...state.profile, login });
        }
      }

      return result;
    },
    async getUserPublicProfile({ state, commit }, { uuid }): Promise<TUserState> {
      if (!state.users[uuid]) {
        commit('updateUsersState', { uuid, user: { status: 'loading' } });

        socket.emitWithAck('getUserProfile', uuid).then((profile) => {
          commit('updateUsersState', { uuid, user: { status: 'ready', profile } });
        });
      }

      return state.users[uuid];
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

socket.on('achievementUnlocked', (achievementID: string) => {
  store.commit('updateUserAchievements', achievementID);
});

socket.on('hiddenAchievementsList', (achievements: string[]) => {
  store.commit('updateUserAchievements', achievements);
});

export function useStore() {
  return baseUseStore(key);
}
