import net from 'net';
import { AddressInfo } from 'net';
import { mailConfig } from './config';
import { smtpSender } from './mail';

test('custom SMTP requires TLS before exposing credentials or sending mail', async () => {
  const commands: string[] = [];
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 test.example SMTP\r\n');
    let buffer = '';
    socket.on('data', (data) => {
      buffer += data.toString();
      let end: number;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const command = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        commands.push(command);
        if (command.startsWith('EHLO')) socket.write('250-test.example\r\n250 AUTH PLAIN LOGIN\r\n');
        else socket.write('454 TLS unavailable\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const config = mailConfig({
      MAIL_ENABLED: 'true',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String((server.address() as AddressInfo).port),
      SMTP_USER: 'firstbyte-user',
      SMTP_PASSWORD: 'firstbyte-secret',
      MAIL_FROM: 'security@avalon-game.com',
      MAIL_FRONTEND_URL: 'https://avalon-game.com',
      MAIL_ENCRYPTION_KEY: 'a'.repeat(64),
      MAIL_EVENT_SECRET: 'b'.repeat(32),
    })!;
    await expect(smtpSender(config)({ to: 'player@example.com', subject: 'test', text: 'test' })).rejects.toMatchObject(
      { code: 'ETLS' },
    );
    expect(commands).toContain('STARTTLS');
    expect(commands.some((command) => /^(AUTH|MAIL|RCPT|DATA)\b/.test(command))).toBe(false);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
