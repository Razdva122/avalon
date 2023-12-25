import type { Dictionary } from '@avalon/types';

export * from '@/helpers/socket';

export const parseCookie = (str: string) =>
  str
    .split(';')
    .map((v) => v.split('='))
    .reduce<Dictionary<string>>((acc, v) => {
      if (v.length === 2) {
        const key = decodeURIComponent(v[0].trim());
        acc[key] = decodeURIComponent(v[1].trim());
      }

      return acc;
    }, {});
