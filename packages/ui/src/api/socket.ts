import { io } from 'socket.io-client';

import type { Dictionary, Socket } from '@avalon/types';

import { socketURL } from '@/api/const';

import { userProfilePath } from '@/store/const';

function getAuthToken(): string | undefined {
  const userProfileInStorage = localStorage.getItem(userProfilePath);
  const profile = userProfileInStorage ? JSON.parse(userProfileInStorage) : null;

  return profile?.token;
}

export const socket: Socket = io(socketURL, {
  withCredentials: true,
  auth: {
    token: getAuthToken(),
  },
});

export const updateAuthToken = () => {
  (<Dictionary<string | undefined>>socket.auth).token = getAuthToken();

  // @ts-expect-error acks is private
  socket.acks = {};
  socket.disconnect().connect();
};
