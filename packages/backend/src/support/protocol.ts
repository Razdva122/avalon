export function parseAmountCents(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('invalid_amount');
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error('invalid_amount');
  const cents = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (cents < 100 || cents > 1000000) throw new Error('invalid_amount');
  return cents;
}
