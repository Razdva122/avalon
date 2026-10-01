// Standard short-context API USD per 1M tokens, checked 2026-10-01.
// https://developers.openai.com/api/docs/pricing
// Older models: /api/docs/models/{id}; gpt-5.5 and gpt-6-sol: /api/docs/models/compare?model={id}
// A visual comparison for an equal amount of uncached input and output tokens.
// This is not a measurement of Codex subscription usage or the cost of a game.
const apiRates: Record<string, readonly [number, number]> = {
  'gpt-6.1-sol': [2, 10],
  'gpt-6-astra': [10, 50],
  'gpt-6-sol': [2, 10],
  'gpt-6-luna': [0.1, 0.5],
  'gpt-5.6-sol': [4, 20],
  'gpt-5.6-terra': [2, 12],
  'gpt-5.6-luna': [0.2, 1.2],
  'gpt-5.5': [5, 30],
};

export function codexRelativePrice(model: string, availableModels: readonly string[]): string | undefined {
  const rate = Object.hasOwn(apiRates, model) ? apiRates[model] : undefined;
  const costs = availableModels.flatMap((id) => {
    const price = Object.hasOwn(apiRates, id) ? apiRates[id] : undefined;
    return price ? [price[0] + price[1]] : [];
  });
  if (!rate || !costs.length || !availableModels.includes(model)) return undefined;
  const relative = (rate[0] + rate[1]) / Math.min(...costs);
  return `$${Number(relative.toFixed(1))}`;
}
