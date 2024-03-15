import type { ServerSocket } from '@avalon/types';

export const handleSocketErrors = (socket: ServerSocket) => {
  const originalOn = socket.on.bind(socket);

  socket.on = (key, listener) => {
    // @ts-expect-error too hard to fix typings
    return originalOn(key, errorHandler(listener, socket));
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = <T extends (...args: any[]) => any | Promise<any>>(handler: T, socket: ServerSocket): T => {
  const handleError = (err: Error) => {
    socket.emit('serverError', err.message);
    console.log(err);
  };

  const func = <T>((...args) => {
    try {
      const res = handler.apply(this, args);

      if (res && typeof res.catch === 'function') {
        // async handler
        res.catch(handleError);
      }

      return res;
    } catch (e) {
      // sync handler
      handleError(<Error>e);
    }
  });

  return func;
};
