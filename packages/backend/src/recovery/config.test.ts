import { mailConfig } from './config';

const base = {
  MAIL_ENABLED: 'true',
  MAIL_FROM: 'security@avalon-game.com',
  MAIL_FRONTEND_URL: 'https://avalon-game.com',
  MAIL_ENCRYPTION_KEY: 'a'.repeat(64),
  MAIL_EVENT_SECRET: 'b'.repeat(32),
};

test('generic SMTP configuration works without Postbox credentials', () => {
  expect(
    mailConfig({
      ...base,
      SMTP_HOST: 'mail.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'firstbyte-user',
      SMTP_PASSWORD: 'firstbyte-secret',
    }),
  ).toMatchObject({ host: 'mail.example.com', port: 587, user: 'firstbyte-user', password: 'firstbyte-secret' });
});

test('existing Postbox configuration keeps its connection settings', () => {
  expect(mailConfig({ ...base, POSTBOX_SMTP_USER: 'old-user', POSTBOX_SMTP_PASSWORD: 'old-secret' })).toMatchObject({
    host: 'postbox.cloud.yandex.net',
    port: 465,
    user: 'old-user',
    password: 'old-secret',
  });
});

test('a custom SMTP host cannot reuse Postbox credentials accidentally', () => {
  expect(() =>
    mailConfig({
      ...base,
      SMTP_HOST: 'mail.example.com',
      POSTBOX_SMTP_USER: 'old-user',
      POSTBOX_SMTP_PASSWORD: 'old-secret',
    }),
  ).toThrow('Incomplete mail configuration');
});

test.each(['0', '65536', 'NaN', '465.5'])('invalid SMTP port %s fails before mail starts', (port) => {
  expect(() =>
    mailConfig({ ...base, SMTP_PORT: port, POSTBOX_SMTP_USER: 'old-user', POSTBOX_SMTP_PASSWORD: 'old-secret' }),
  ).toThrow('Invalid SMTP configuration');
});
