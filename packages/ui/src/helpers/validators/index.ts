import { i18n } from '@/plugins/i18n';

export const validators = {
  required: (value: string) => {
    if (value) return true;

    return i18n.global.t('validators.requiredField');
  },
  min8: (value: string) => value.length >= 8 || i18n.global.t('validators.minCharacters', { count: 8 }),
  maxPasswordBytes: (value: string) =>
    new TextEncoder().encode(value).length <= 72 || i18n.global.t('passwordRecovery.passwordTooLong'),
  name: (value: string) => {
    if (value.length > 100) return i18n.global.t('validators.maxCharacters', { count: 100 });
    return (value.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(value)) || i18n.global.t('validators.invalidName');
  },
  email: (value: string) => {
    if (value.length > 254) return i18n.global.t('validators.maxCharacters', { count: 254 });
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'example@email.com';
  },
  login: (value: string) => {
    if (value.length > 100) return i18n.global.t('validators.maxCharacters', { count: 100 });
    return /^[a-zA-Z0-9_.-]+$/.test(value) || i18n.global.t('validators.loginSymbols');
  },
  spacesForbidden: (value: string) => /^\S+$/.test(value) || i18n.global.t('validators.spacesForbidden'),
};
