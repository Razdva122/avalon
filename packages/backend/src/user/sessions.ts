import { validateJWT } from '@/user';
import { userProfileModel } from '@/db/models';
import type { Server, ServerSocket } from '@avalon/types';

export async function authenticatedUser(token: string) {
  const user = validateJWT(token);
  if (typeof user.id !== 'string' || !Number.isSafeInteger(user.authVersion ?? 0)) throw new Error('invalid_session');
  const exists = await userProfileModel.exists({
    id: user.id,
    $expr: { $eq: [{ $ifNull: ['$authVersion', 0] }, user.authVersion ?? 0] },
  });
  if (!exists) throw new Error('revoked_session');
  return user;
}

function revoke(socket: ServerSocket) {
  socket.emit('renewJWT');
  socket.disconnect(true);
}

export function installSessionChecks(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next();
    void authenticatedUser(token).then(
      (user) => {
        socket.data.authUser = user;
        next();
      },
      () => {
        socket.data.invalidSession = true;
        next(); // Retain guest access and let the client discard its stale token.
      },
    );
  });
  io.on('connection', (socket) => {
    if (socket.data.invalidSession) socket.emit('renewJWT');
    if (!socket.data.authUser) return;
    socket.use((_packet, next) => {
      void authenticatedUser(socket.handshake.auth.token).then(
        () => next(),
        () => {
          revoke(socket);
          next(new Error('revoked_session'));
        },
      );
    });
    const timer = setInterval(() => {
      void authenticatedUser(socket.handshake.auth.token).catch(() => revoke(socket));
    }, 60000);
    timer.unref();
    socket.on('disconnect', () => clearInterval(timer));
  });
}

export function revokeUserSockets(io: Server, userID: string) {
  io.to(userID).emit('renewJWT');
  io.in(userID).disconnectSockets(true);
}
