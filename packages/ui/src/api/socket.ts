import { io } from 'socket.io-client';

import type { Dictionary, Socket } from '@avalon/types';

import { socketURL } from '@/api/const';

function getAuthToken(): string | undefined {
  const userProfileInStorage = localStorage.getItem(userProfilePath);
  const profile = userProfileInStorage ? JSON.parse(userProfileInStorage) : null;

  return profile?.token;
}

import { userProfilePath } from '@/store/const';

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
