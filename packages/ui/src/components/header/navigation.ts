import { basePath } from '../../router/paths';

export function inNavigationSection(path: string, section: string): boolean {
  const current = basePath(path);
  return current === section || (section !== '/' && current.startsWith(section));
}
