import nodemailer from 'nodemailer';
import { MailConfig } from './config';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}
export function smtpSender(config: MailConfig): (mail: Mail) => Promise<void> {
  const transport = nodemailer.createTransport({
    host: 'postbox.cloud.yandex.net',
    port: 465,
    secure: true,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return async (mail) => {
    await transport.sendMail({
      from: { name: 'Avalon', address: config.from },
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      headers: { 'Auto-Submitted': 'auto-generated' },
    });
  };
}

export function renderMail(to: string, language: string, url?: string): Mail {
  const ru = language === 'ru';
  return {
    to,
    subject: url
      ? ru
        ? 'Восстановление пароля Avalon'
        : 'Reset your Avalon password'
      : ru
        ? 'Пароль Avalon изменён'
        : 'Your Avalon password was changed',
    text: url
      ? ru
        ? `Чтобы задать новый пароль Avalon, откройте ссылку:\n\n${url}\n\nСсылка действует 30 минут с момента запроса. Если вы не запрашивали восстановление, просто проигнорируйте письмо. Ваш пароль не изменён.`
        : `To set a new Avalon password, open this link:\n\n${url}\n\nThe link expires 30 minutes after your request. If you did not request this, ignore this email. Your password has not changed.`
      : ru
        ? 'Пароль вашего аккаунта Avalon изменён. Все предыдущие сессии завершены. Если это были не вы, откройте сайт Avalon и восстановите доступ или обратитесь к команде проекта.'
        : 'Your Avalon password was changed. Previous sessions have been signed out. If this was not you, open the Avalon website to recover your account or contact the project team.',
  };
}
