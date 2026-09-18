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

const templates = {
  en: {
    resetSubject: 'Reset your Avalon password',
    changedSubject: 'Your Avalon password was changed',
    intro: 'To set a new Avalon password, open this link:',
    reminder:
      'The link expires 30 minutes after your request. If you did not request this, ignore this email. Your password has not changed.',
    changed:
      'Your Avalon password was changed. Previous sessions have been signed out. If this was not you, open the Avalon website to recover your account or contact the project team.',
  },
  ru: {
    resetSubject: 'Восстановление пароля Avalon',
    changedSubject: 'Пароль Avalon изменён',
    intro: 'Чтобы задать новый пароль Avalon, откройте ссылку:',
    reminder:
      'Ссылка действует 30 минут с момента запроса. Если вы не запрашивали восстановление, просто проигнорируйте письмо. Ваш пароль не изменён.',
    changed:
      'Пароль вашего аккаунта Avalon изменён. Все предыдущие сессии завершены. Если это были не вы, откройте сайт Avalon и восстановите доступ или обратитесь к команде проекта.',
  },
  es: {
    resetSubject: 'Restablece tu contraseña de Avalon',
    changedSubject: 'Tu contraseña de Avalon ha cambiado',
    intro: 'Para establecer una nueva contraseña de Avalon, abre este enlace:',
    reminder:
      'El enlace caduca 30 minutos después de tu solicitud. Si no solicitaste este cambio, ignora este correo. Tu contraseña no ha cambiado.',
    changed:
      'La contraseña de tu cuenta de Avalon ha cambiado. Se han cerrado todas las sesiones anteriores. Si no has sido tú, abre el sitio de Avalon para recuperar tu cuenta o contacta con el equipo del proyecto.',
  },
  pt: {
    resetSubject: 'Redefina sua senha do Avalon',
    changedSubject: 'Sua senha do Avalon foi alterada',
    intro: 'Para definir uma nova senha do Avalon, abra este link:',
    reminder:
      'O link expira 30 minutos após sua solicitação. Se você não solicitou esta alteração, ignore este e-mail. Sua senha não foi alterada.',
    changed:
      'A senha da sua conta do Avalon foi alterada. Todas as sessões anteriores foram encerradas. Se não foi você, abra o site do Avalon para recuperar sua conta ou entre em contato com a equipe do projeto.',
  },
  'zh-CN': {
    resetSubject: '重置 Avalon 密码',
    changedSubject: 'Avalon 密码已更改',
    intro: '要设置新的 Avalon 密码，请打开以下链接：',
    reminder: '链接自申请之日起 30 分钟内有效。如果您没有申请重置密码，请忽略此邮件。您的密码尚未更改。',
    changed:
      '您的 Avalon 账号密码已更改，之前的所有登录会话均已退出。如果这不是您本人操作，请打开 Avalon 网站找回账号，或联系项目团队。',
  },
  'zh-TW': {
    resetSubject: '重設 Avalon 密碼',
    changedSubject: 'Avalon 密碼已變更',
    intro: '若要設定新的 Avalon 密碼，請開啟以下連結：',
    reminder: '連結自申請起 30 分鐘內有效。如果您未申請重設密碼，請忽略此郵件。您的密碼尚未變更。',
    changed:
      '您的 Avalon 帳號密碼已變更，先前的所有登入工作階段均已登出。如果這不是您本人的操作，請開啟 Avalon 網站找回帳號，或聯絡專案團隊。',
  },
};

export type MailLanguage = keyof typeof templates;
export function mailLanguage(value: unknown): MailLanguage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(templates, value)
    ? (value as MailLanguage)
    : 'en';
}

export function renderMail(to: string, language: string, url?: string): Mail {
  const template = templates[mailLanguage(language)];
  return {
    to,
    subject: url ? template.resetSubject : template.changedSubject,
    text: url ? `${template.intro}\n\n${url}\n\n${template.reminder}` : template.changed,
  };
}
