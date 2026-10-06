import { startGiveawayWorker } from './worker';
import { GiveawayService } from './service';
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});
test('worker waits for processing before scheduling another poll and stops cleanly', async () => {
  let attempts = 0;
  let finish: (value: boolean) => void = () => {};
  const service = {
    processOne: async () => {
      attempts++;
      return new Promise<boolean>((resolve) => {
        finish = resolve;
      });
    },
  } as GiveawayService;
  const stop = startGiveawayWorker(service);
  expect(attempts).toBe(1);
  await jest.advanceTimersByTimeAsync(30000);
  expect(attempts).toBe(1);
  finish(false);
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(15000);
  expect(attempts).toBe(2);
  stop();
  finish(false);
  await jest.advanceTimersByTimeAsync(60000);
  expect(attempts).toBe(2);
  expect(jest.getTimerCount()).toBe(0);
});
test('worker retries failed processing with a safe diagnostic', async () => {
  let attempts = 0;
  const service = {
    processOne: async () => {
      attempts++;
      throw Error('private database credentials');
    },
  } as unknown as GiveawayService;
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const stop = startGiveawayWorker(service);
  try {
    await jest.advanceTimersByTimeAsync(15000);
    expect(attempts).toBe(2);
    expect(warn.mock.calls.flat().join()).not.toContain('private database credentials');
  } finally {
    stop();
    warn.mockRestore();
  }
});
