import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { updateUserData, clearUserData } from '@/store/persistent';
import { userStoragePath } from '@/store/const';
import type { IState, IUser } from '@/store/interface';

export * from '@/store/interface';

import { socket } from '@/api/socket';

export const key: InjectionKey<Store<IState>> = Symbol();

const userInStorage = localStorage.getItem(userStoragePath);

if (userInStorage) {
  updateUserData(JSON.parse(userInStorage));
}

export const store = createStore<IState>({
  state: {
    user: userInStorage ? JSON.parse(userInStorage) : null,
    connect: null,
  },
  getters: {},
  mutations: {
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

    clearUserData() {
      localStorage.removeItem(userStoragePath);
      clearUserData();
    },

    updateConnectState(state: IState, value: boolean) {
      state.connect = value;
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
