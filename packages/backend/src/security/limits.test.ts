import { WindowLimiter, PasswordWork } from './limits';

test('a budget spans sockets and recovers after the window expires', () => {
  const limits = new WindowLimiter(2);
  expect(limits.take('account', 2, 100, 0)).toBe(true);
  expect(limits.take('account', 2, 100, 1)).toBe(true);
  expect(limits.take('account', 2, 100, 2)).toBe(false);
  expect(limits.take('account', 2, 100, 100)).toBe(true);
});
test('unique attacker keys cannot grow the limiter beyond its capacity', () => {
  const limits = new WindowLimiter(2);
  expect(limits.take('one', 1, 100, 0)).toBe(true);
  expect(limits.take('two', 1, 100, 0)).toBe(true);
  expect(limits.take('three', 1, 100, 0)).toBe(false);
  expect(limits.take('three', 1, 100, 100)).toBe(true);
});
test('password work rejects overload without an unbounded queue and releases on failure', async () => {
  const work = new PasswordWork(1);
  let finish!: () => void;
  const active = work.run(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await expect(work.run(async () => 'overflow')).rejects.toThrow('rateLimited');
  finish();
  await active;
  await expect(
    work.run(async () => {
      throw Error('failed');
    }),
  ).rejects.toThrow('failed');
  await expect(work.run(async () => 'allowed')).resolves.toBe('allowed');
});
