// Yandex AI Studio synchronous RUB prices including VAT, checked 2026-09-23:
// https://aistudio.yandex.ru/ru/docs/ai-studio/pricing
// Units per token: 10,000 units = 1 RUB. Keep billing and model selection together.
export const DEFAULT_AI_MODEL = 'qwen3.6-35b-a3b';
export const AI_MODELS = {
  'qwen3.6-35b-a3b': { label: 'Qwen3.6 35B', input: 2, cached: 0.5, output: 3 },
  'deepseek-v4-flash': { label: 'DeepSeek V4 Flash', input: 3, cached: 0.75, output: 5 },
} as const;

export function aiModel(id = process.env.YANDEX_MODEL || DEFAULT_AI_MODEL) {
  if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(AI_MODELS, id))
    throw Error(`Unsupported AI model. Choose: ${Object.keys(AI_MODELS).join(', ')}`);
  return { id, tariff: AI_MODELS[id as keyof typeof AI_MODELS] };
}
