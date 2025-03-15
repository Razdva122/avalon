import { i18n } from '@/plugins/i18n';

export const validators = {
  required: (value: string) => {
    if (value) return true;

    return i18n.global.t('validators.requiredField');
  },
  min8: (value: string) => value.length >= 8 || i18n.global.t('validators.minCharacters', { count: 8 }),
  email: (value: string) => Boolean(value.match(/^\S+@\S+\.\S+$/)) || 'example@email.com',
  login: (value: string) => Boolean(value.match(/^[a-zA-Z0-9_.-]+$/)) || i18n.global.t('validators.loginSymbols'),
  spacesForbidden: (value: string) => /^\S+$/.test(value) || i18n.global.t('validators.spacesForbidden'),
};
