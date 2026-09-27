import type { ServerSocket } from '@avalon/types';
import { validPacket } from '@/security/validation';

const lifecycle = new Set(['disconnect', 'disconnecting', 'error']);
const publicErrors = new Set(['invalidRequest', 'rateLimited', 'roomLimit', 'forbidden']);
export const handleSocketErrors = (socket: ServerSocket) => {
  const originalOn = socket.on.bind(socket);
  socket.on = (key, listener) => originalOn(key, errorHandler(listener, socket, key));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = <T extends (...args: any[]) => any | Promise<any>>(
  handler: T,
  socket: ServerSocket,
  event?: string,
): T => {
  return ((...args: unknown[]) => {
    const reply =
      typeof args[args.length - 1] === 'function' ? (args[args.length - 1] as (result: unknown) => void) : undefined;
    const fail = (error: unknown) => {
      const code = error instanceof Error && publicErrors.has(error.message) ? error.message : 'requestFailed';
      if (reply) reply({ error: code });
      else socket.emit('serverError', code);
    };
    try {
      if (event && !lifecycle.has(event) && !validPacket(event, args)) throw Error('invalidRequest');
      const result = handler(...args);
      return result && typeof result.catch === 'function' ? result.catch(fail) : result;
    } catch (error) {
      fail(error);
    }
  }) as T;
};
