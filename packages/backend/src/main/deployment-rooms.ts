import type { Request, Response } from 'express';
import type { Manager } from './index';

const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function deploymentRoomsHandler(manager: Pick<Manager, 'getActiveRoomIDs'>) {
  return (request: Request, response: Response): void => {
    // Use the connection address directly, regardless of Express proxy trust settings.
    if (
      !loopback.has(request.socket.remoteAddress || '') ||
      request.headers.forwarded !== undefined ||
      request.headers['x-forwarded-for'] !== undefined
    ) {
      response.status(404).end();
      return;
    }
    response.set('Cache-Control', 'no-store').json({ activeRooms: manager.getActiveRoomIDs() });
  };
}
