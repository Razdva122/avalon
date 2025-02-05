import snakeCase from 'lodash/snakeCase';

import { store } from '@/store';
import { TVisibleRole } from '@avalon/types';

export function calculateRoleUrl(role: TVisibleRole): string {
  let prefix: string = '';

  if (store.state.user?.settings?.style === 'anime') {
    prefix = '/anime';
  }

  return require(`@/assets/roles${prefix}/${snakeCase(role)}.webp`);
}

export function computedStyles(): string[] {
  if (store.state.user?.settings?.style === 'anime') {
    return ['anime-style'];
  }

  return [];
}
