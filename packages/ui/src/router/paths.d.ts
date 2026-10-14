export function basePath(path: string): string;
export function localizedPath(path: string, language: string): string;
export function languageSwitchTarget(
  path: string,
  language: string,
  availableLocales?: readonly string[],
  hash?: string,
): { path: string; hash: string };
export function isNeutralPath(path: string): boolean;
export function neutralRoomUrl(url: string): string;
