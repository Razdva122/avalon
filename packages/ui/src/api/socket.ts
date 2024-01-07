import { io } from 'socket.io-client';

import type { Socket } from '@avalon/types';

import { socketURL } from '@/api/const';

export const socket: Socket = io(socketURL, {
  withCredentials: true,
});
