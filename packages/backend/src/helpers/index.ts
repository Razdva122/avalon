import type { Dictionary } from '@avalon/types';

export const parseCookie = (str: string) =>
  str
    .split(';')
    .map((v) => v.split('='))
    .reduce<Dictionary<string>>((acc, v) => {
      const key = decodeURIComponent(v[0].trim());
      acc[key] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});
