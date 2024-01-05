import { io } from 'socket.io-client';

import type { Socket } from '@avalon/types';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

export const socket: Socket = io(`http://${HOSTNAME}:${PORT}`, {
  withCredentials: true,
});
