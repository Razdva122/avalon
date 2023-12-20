import axios from 'axios';
import { InjectionKey } from 'vue';
import { createStore, Store, useStore as baseUseStore } from 'vuex';

import { userStoragePath } from '@/store/const';

export interface IState {
  user: IUser | null;
}

export interface IUser {
  id: string;
  name: string;
}

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
      localStorage.setItem(userStoragePath, JSON.stringify(user));
      axios.defaults.headers.common.Authorization = `${user.id}`;
    },

    updateUserName(state: IState, name: string) {
      state.user!.name = name;
      localStorage.setItem(userStoragePath, JSON.stringify(state.user));
    },

    clearUserData() {
      localStorage.removeItem(userStoragePath);
    },
  },
  actions: {},
  modules: {},
});

export function useStore() {
  return baseUseStore(key);
}
