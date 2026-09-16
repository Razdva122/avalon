import type { TLanguage } from '@/i18n/interface';
export const languages: TLanguage[];
export function normalizeLanguage(value: unknown): TLanguage | undefined;
export function preferredLanguage(settings: unknown, browserLanguages?: readonly string[]): TLanguage;
export function pageLanguage(pathname: string, isNeutral: boolean, preferred: string): TLanguage;
export function parseStoredObject(raw: string | null): Record<string, unknown> | null;
