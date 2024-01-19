import { io } from 'socket.io-client';

import type { Socket } from '@avalon/types';

import { socketURL } from '@/api/const';

import '@/store/init';

export const socket: Socket = io(socketURL, {
  withCredentials: true,
});
