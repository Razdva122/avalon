import proxyaddr from 'proxy-addr';
import type { IncomingMessage } from 'http';
import type { Server } from '@avalon/types';
import { WindowLimiter } from './limits';

export function clientAddress(request: IncomingMessage, trusted = process.env.TRUSTED_PROXY_CIDRS): string {
  const trust = trusted
    ? proxyaddr.compile(
        trusted
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : () => false;
  return proxyaddr(request, trust);
}

export function installSocketAdmission(io: Server) {
  const limits = new WindowLimiter();
  io.use((socket, next) => {
    const ip = clientAddress(socket.request);
    socket.data.clientIP = ip;
    if (!limits.take(`connect:${ip}`, 60, 60000)) return next(Error('rateLimited'));
    next();
  });
  io.on('connection', (socket) => {
    const local = new WindowLimiter(1);
    socket.use((packet, next) => {
      const [event, first] = packet;
      const ip = socket.data.clientIP;
      const user = socket.data.authUser?.id;
      let allowed =
        local.take('packets', 120, 10000) &&
        limits.take(`packets:${ip}`, 1200, 60000) &&
        limits.take('global-packets', 5000, 10000);
      if (user) allowed = allowed && limits.take(`user:${user}`, 600, 60000);
      if (event === 'registerUser') allowed = allowed && limits.take(`register:${ip}`, 5, 3600000);
      if (event === 'login') {
        allowed = allowed && limits.take(`login-ip:${ip}`, 30, 900000);
        if (typeof first === 'string' && first.length <= 254)
          allowed = allowed && limits.take(`login-account:${first.toLowerCase().trim()}`, 10, 900000);
      }
      if (['updateUserPassword', 'updateUserEmail', 'updateUserLogin'].includes(event))
        allowed = allowed && limits.take(`credentials:${user || ip}`, 10, 900000);
      if (
        [
          'getTotalStats',
          'getPlayerGames',
          'getPlayerGameSummaries',
          'getPlayerGameSummariesPage',
          'getAiRoomsList',
        ].includes(event)
      )
        allowed = allowed && limits.take(`expensive:${ip}`, 60, 60000);
      if (['createRoom', 'restartGame'].includes(event))
        allowed = allowed && limits.take(`create:${user || ip}`, 10, 60000);
      if (!allowed) {
        const ack = packet[packet.length - 1];
        if (typeof ack === 'function') ack({ error: 'rateLimited' });
        else socket.emit('serverError', 'rateLimited');
        next(Error('rateLimited'));
        return;
      }
      // Unknown events must not cause authentication database work.
      if (!socket.listenerCount(event)) {
        next(Error('invalidRequest'));
        return;
      }
      next();
    });
    // Socket middleware rejections are consumed; they are not process errors.
    socket.on('error', () => {});
  });
}
