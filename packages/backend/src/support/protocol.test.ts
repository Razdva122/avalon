import { parseAmountCents } from './protocol';

test('parses amounts exactly, rejecting invalid precision and out-of-range values', () => {
  expect(parseAmountCents('10.01')).toBe(1001);
  expect(parseAmountCents(10)).toBe(1000);
  for (const value of ['10.001', '-10', '1e3', {}, null, Infinity, '0.99', '10000.01'])
    expect(() => parseAmountCents(value)).toThrow();
});
