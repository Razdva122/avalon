import type { BotQuotaThresholds } from '@avalon/types';

export const defaultBotQuotaThresholds: BotQuotaThresholds = {
  smart: { shortTerm: 30, weekly: 3 },
  regular: { shortTerm: 30, weekly: 3 },
  beginner: { shortTerm: 20, weekly: 1 },
};

export function validBotQuotaThresholds(value: unknown): value is BotQuotaThresholds {
  const record = (item: unknown): item is Record<string, unknown> =>
    item !== null &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    Object.getPrototypeOf(item) === Object.prototype;
  return (
    record(value) &&
    Object.keys(value).length === 3 &&
    ['smart', 'regular', 'beginner'].every((mode) => {
      const limits = value[mode];
      return (
        record(limits) &&
        Object.keys(limits).length === 2 &&
        ['shortTerm', 'weekly'].every(
          (window) =>
            typeof limits[window] === 'number' &&
            Number.isInteger(limits[window]) &&
            limits[window] >= 0 &&
            limits[window] <= 100,
        )
      );
    })
  );
}

// Keep the legacy wire field as an alias; regular is the only standard quota policy.
export function canonicalBotQuotaThresholds(value: BotQuotaThresholds): BotQuotaThresholds {
  return { ...value, smart: { ...value.regular } };
}
