import snakeCase from 'lodash/snakeCase';
import { getImagePathByID } from '@/helpers/images';

import { store } from '@/store';
import { TVisibleRole } from '@avalon/types';

// Список ролей, для которых есть legacy изображения
const LEGACY_ROLES = [
  'merlin',
  'minion',
  'mordred',
  'morgana',
  'oberon',
  'percival',
  'servant',
  'merlin_pure',
  'tristan',
  'isolde',
  'good_lancelot',
  'evil_lancelot',
  'unknown_lancelot',
  'guinevere',
  'troublemaker',
  'cleric',
  'trickster',
  'lunatic',
  'brute',
  'witch',
  'revealer',
  'wraith',
];

export function calculateRoleUrl(role: TVisibleRole): string {
  const style = store.state.settings?.style;
  const roleSnake = snakeCase(role);

  if (style === 'anime') {
    return getImagePathByID('roles/anime', roleSnake);
  }

  // Для legacy проверяем, есть ли изображение для этой роли
  if (style === 'legacy' && LEGACY_ROLES.includes(roleSnake)) {
    return getImagePathByID('roles/legacy', roleSnake);
  }

  return getImagePathByID('roles', roleSnake);
}

export function computedStyles(): string[] {
  const style = store.state.settings?.style;

  if (style === 'anime') {
    return ['anime-style'];
  }

  if (style === 'legacy') {
    return ['legacy-style'];
  }

  return [];
}
