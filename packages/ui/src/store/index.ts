import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { v4 as uuidv4 } from 'uuid';

import { updateUserProfile, updateUserAlertsData, clearUserProfile, updateUserSettings } from '@/store/persistent';

import type { IState, TAlertsName, IUserSettings, TUserState } from '@/store/interface';

import { alertsInStorage, userProfileInStorage, userSettingsInStorage } from '@/store/init';

export * from '@/store/interface';

import { socket } from '@/api/socket';
import { isSocketError } from '@/helpers/socket-errors';
import { validators } from '@/helpers/validators';
import eventBus from '@/helpers/event-bus';
import { i18n } from '@/plugins/i18n';
import { hydratePage } from '@/helpers/prerender';

import type { ArgumentOfCallback, UserWithToken } from '@avalon/types';

export const key: InjectionKey<Store<IState>> = Symbol();

// Keep failed lookups retryable without changing the reactive loading placeholder:
// changing it would retrigger useUserProfile watchEffect and immediately retry.
const failedProfileLookups = new Set<string>();

export const store = createStore<IState>({
  state: {
    profile: !hydratePage && userProfileInStorage ? JSON.parse(userProfileInStorage) : null,
    settings: !hydratePage && userSettingsInStorage ? JSON.parse(userSettingsInStorage) : null,
    hideSpoilers: false,
    connect: null,
    users: {},
    alerts: alertsInStorage ? JSON.parse(alertsInStorage) : {},
  },
  getters: {},
  mutations: {
    restoreClientPreferences(state: IState) {
      state.profile = userProfileInStorage ? JSON.parse(userProfileInStorage) : null;
      state.settings = userSettingsInStorage ? JSON.parse(userSettingsInStorage) : null;
    },
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

      const user = await socket
        .timeout(10000)
        .emitWithAck('registerUser', {
          password,
          id,
          name,
          email,
          login,
        })
        .catch(() => ({ error: 'requestFailed' as const }));

      if (!('error' in user)) {
        commit('updateUserProfile', user);
      }

      return user;
    },
    async updateUserPassword(_state, { password, newPassword }): Promise<ArgumentOfCallback<'updateUserPassword'>> {
      const result = socket.emitWithAck('updateUserPassword', password, newPassword);
      return result;
    },
    async updateUserName({ commit, state }, { name }): Promise<true | { error: string }> {
      if (!state.profile) return { error: 'forbidden' };
      if (validators.name(name) !== true) return { error: 'invalidRequest' };
      const result = await socket.timeout(10000).emitWithAck('updateUserName', name);
      if (result === true && state.profile) {
        commit('updateUserProfile', { ...state.profile, name });
      }
      return result;
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
      let result: ArgumentOfCallback<'getMyProfile'>;
      try {
        result = await socket.timeout(10000).emitWithAck('getMyProfile');
      } catch {
        result = { error: 'requestFailed' };
      }
      if (isSocketError(result)) {
        eventBus.emit('infoMessage', i18n.global.t('errors.' + result.error));
        return result;
      }

      if (state.profile) {
        commit('updateUserProfile', { ...state.profile, ...result });
      }

      return result;
    },
    async updateUserAvatar({ commit, state }, { avatarID }): Promise<ArgumentOfCallback<'updateUserAvatar'>> {
      const owner = state.profile?.id;
      if (!owner) return { error: 'avatarNotAvailable' };
      const result = await socket.timeout(10000).emitWithAck('updateUserAvatar', avatarID);

      if (state.profile?.id === owner) {
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
      if (!state.users[uuid] || failedProfileLookups.has(uuid)) {
        failedProfileLookups.delete(uuid);
        commit('updateUsersState', { uuid, user: { status: 'loading' } });

        socket
          .timeout(10000)
          .emitWithAck('getUserProfile', uuid)
          .then((profile) => {
            if (isSocketError(profile)) {
              failedProfileLookups.add(uuid);
              eventBus.emit('infoMessage', i18n.global.t('errors.' + profile.error));
              return;
            }
            commit('updateUsersState', { uuid, user: { status: 'ready', profile } });
          })
          .catch(() => {
            failedProfileLookups.add(uuid);
            eventBus.emit('infoMessage', i18n.global.t('errors.requestFailed'));
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
