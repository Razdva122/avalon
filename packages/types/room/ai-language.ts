export const aiLanguages = ['en', 'ru', 'zh-tw', 'es', 'vi', 'pt', 'zh-cn'] as const;
export type AiLanguage = (typeof aiLanguages)[number];

export function isAiLanguage(value: unknown): value is AiLanguage {
  return typeof value === 'string' && (aiLanguages as readonly string[]).includes(value);
}
