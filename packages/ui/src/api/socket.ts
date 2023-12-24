import { io } from 'socket.io-client';

import type { Socket } from '@avalon/types';

export const socket: Socket = io('http://localhost:3000', {
  withCredentials: true,
});
