import { lobbyAiSizes } from '@avalon/types';

test.each([false, true])('lobby bot limits cover every human count, premium=%s', (premium) => {
  for (let humans = 1; humans <= 10; humans++) {
    const sizes = lobbyAiSizes(humans, premium);
    expect(sizes.map((size) => size.playerCount)).toEqual([5, 6, 7, 8].filter((total) => total > humans));
    for (const size of sizes) {
      expect(size.botCount).toBe(size.playerCount - humans);
      expect(size.requiresPremium).toBe(!premium && size.playerCount >= 7 && size.botCount > 2);
    }
  }
});

test.each([0, -1, 1.5, NaN, Infinity])('invalid human count %s has no launch options', (humans) => {
  expect(lobbyAiSizes(humans, true)).toEqual([]);
});
