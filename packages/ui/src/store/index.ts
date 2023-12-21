import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { updateUserData, clearUserData } from '@/store/persistent';

import { userStoragePath } from '@/store/const';

import type { IState, IUser } from '@/store/interface';

export * from '@/store/interface';

export const key: InjectionKey<Store<IState>> = Symbol();

const userInStorage = localStorage.getItem(userStoragePath);

export const store = createStore<IState>({
  state: {
    user: userInStorage ? JSON.parse(userInStorage) : null,
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
  },
  actions: {},
  modules: {},
});

export function useStore() {
  return baseUseStore(key);
}
