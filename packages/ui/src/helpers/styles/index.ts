import snakeCase from 'lodash/snakeCase';
import { getImagePathByID, getThumbnailPathByID } from '@/helpers/images';
import { roleFraming } from './role-framing';

import { store } from '@/store';
import { TVisibleRole } from '@avalon/types';

type RoleArtwork = TVisibleRole | 'revealer_hidden' | 'revealer_progress';

function roleArt(role: string) {
  const preference = store.state.settings?.style;
  const style = preference === 'anime' || preference === 'legacy' ? preference : 'default';
  const id = role === 'mysteryWizard' ? 'mystery' : snakeCase(role);
  const framing = roleFraming[style][id];
  const folder = style === 'default' ? ('roles' as const) : (`roles/${style}` as const);
  return { id, framing, folder };
}

export function calculateRoleUrl(role: RoleArtwork): string {
  const { id, folder } = roleArt(role);
  return getImagePathByID(folder, id);
}

export function calculateRolePortraitStyle(role: string): Record<string, string | number> {
  const { framing } = roleArt(role);
  if (!framing) return {};
  const [scale, x, y] = framing;
  return { '--role-image-scale': scale, '--role-image-position': `${x}% ${y}%` };
}

export function calculateRoleIconStyle(role: string, thumbnail: boolean): Record<string, string> {
  const { id, folder, framing } = roleArt(role);
  if (!framing) return {};
  const [, , , size, x, y] = framing;
  const url = thumbnail ? getThumbnailPathByID(folder, id) : getImagePathByID(folder, id);
  return { backgroundImage: `url("${url}")`, backgroundSize: `${size}%`, backgroundPosition: `${x}% ${y}%` };
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
