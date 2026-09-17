describe('premium cosmetics release defaults', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    if (original === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original;
  });

  test.each([
    ['development', true],
    ['production', false],
    ['test', false],
    [undefined, false],
  ])('environment %s enables cosmetics: %s', (environment, enabled) => {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
    jest.isolateModules(() => {
      const { PREMIUM_COSMETICS_ENABLED } = jest.requireActual('@avalon/types/user/premium-cosmetics');
      expect(PREMIUM_COSMETICS_ENABLED).toBe(enabled);
      const { STICKERS } = jest.requireActual('@avalon/types/user/stickers');
      expect(STICKERS.some((sticker: { premium?: boolean }) => sticker.premium)).toBe(enabled);
    });
  });
});
