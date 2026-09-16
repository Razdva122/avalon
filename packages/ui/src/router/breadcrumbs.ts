import { basePath, localizedPath } from './paths';

export function wikiBreadcrumbs(path: string, language: string, translate: (key: string) => string) {
  const parts = basePath(path).split('/').filter(Boolean);
  return parts.map((part, index) => ({
    to: localizedPath('/' + parts.slice(0, index + 1).join('/'), language),
    title: translate(`breadCrumbs.${part}`),
  }));
}
