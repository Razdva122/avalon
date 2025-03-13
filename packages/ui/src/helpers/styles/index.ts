import snakeCase from 'lodash/snakeCase';
import { getImagePathByID } from '@/helpers/images';

import { store } from '@/store';
import { TVisibleRole } from '@avalon/types';

export function calculateRoleUrl(role: TVisibleRole): string {
  let type: 'roles' | 'roles/anime' = 'roles';

  if (store.state.settings?.style === 'anime') {
    type = 'roles/anime';
  }

  return getImagePathByID(type, snakeCase(role));
}

export function computedStyles(): string[] {
  if (store.state.settings?.style === 'anime') {
    return ['anime-style'];
  }

  return [];
}
