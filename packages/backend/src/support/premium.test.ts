import { hasPremium } from './premium';

test('manual grants unlock Premium without inventing a donation', () => {
  expect(hasPremium(0, { premiumGrantedAt: new Date() })).toBe(true);
  expect(hasPremium(0, null)).toBe(false);
});
test('donations unlock Premium at the threshold independently of badge visibility', () => {
  expect(hasPremium(999, {})).toBe(false);
  expect(hasPremium(1000, {})).toBe(true);
});
