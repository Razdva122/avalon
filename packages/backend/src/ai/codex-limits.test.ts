import { parseWeeklyLimit, readCodexWeeklyLimit } from './codex-limits';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
jest.mock('child_process', () => ({ spawn: jest.fn() }));
test.each(['primary', 'secondary'])(
  'finds weekly window in %s, uses the Codex bucket and only returns display fields',
  (slot) => {
    expect(
      parseWeeklyLimit(
        {
          rateLimitsByLimitId: {
            codex: {
              [slot]: { usedPercent: 81, windowDurationMins: 10080, resetsAt: 1900000000 },
              planType: 'private',
            },
          },
          rateLimits: { primary: { usedPercent: 1, windowDurationMins: 10080 } },
        },
        100,
      ),
    ).toEqual({ remainingPercent: 19, resetsAt: 1900000000, checkedAt: 100 });
  },
);
test('missing weekly data is unavailable, zero usage is valid, percentages are clamped', () => {
  expect(parseWeeklyLimit({ rateLimits: { primary: { usedPercent: 3, windowDurationMins: 300 } } })).toBeNull();
  for (const [usedPercent, remainingPercent] of [
    [0, 100],
    [101, 0],
    [-1, 100],
  ])
    expect(
      parseWeeklyLimit({ rateLimits: { secondary: { usedPercent, windowDurationMins: 10080 } } })?.remainingPercent,
    ).toBe(remainingPercent);
  expect(parseWeeklyLimit({ rateLimits: { secondary: { usedPercent: null, windowDurationMins: 10080 } } })).toBeNull();
});
test('read-only account request initializes before querying, uses selected profile and excludes backend secrets', async () => {
  const old = { ...process.env };
  process.env.AI_CODEX_HOME = '/private/test-profile';
  process.env.YANDEX_API_KEY = 'secret';
  const sent: { method: string; id?: number }[] = [];
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    stdin: new PassThrough(),
    kill: jest.fn(),
  });
  let pending = '';
  child.stdin.on('data', (chunk) => {
    pending += chunk;
    let newline;
    while ((newline = pending.indexOf('\n')) !== -1) {
      const message = JSON.parse(pending.slice(0, newline));
      pending = pending.slice(newline + 1);
      sent.push(message);
      queueMicrotask(() => {
        if (message.method === 'initialize') child.stdout.write(JSON.stringify({ id: message.id, result: {} }) + '\n');
        if (message.method === 'account/rateLimits/read')
          child.stdout.write(
            JSON.stringify({
              id: message.id,
              result: { rateLimits: { primary: { usedPercent: 72, windowDurationMins: 10080 } } },
            }) + '\n',
          );
      });
    }
  });
  (spawn as jest.Mock).mockReturnValue(child);
  try {
    expect((await readCodexWeeklyLimit())?.remainingPercent).toBe(28);
    expect(sent.map((m) => m.method)).toEqual(['initialize', 'initialized', 'account/rateLimits/read']);
    const options = (spawn as jest.Mock).mock.calls[0][2];
    expect(options.env.CODEX_HOME).toBe('/private/test-profile');
    expect(options.env.YANDEX_API_KEY).toBeUndefined();
    expect(child.kill).toHaveBeenCalled();
  } finally {
    process.env = old;
    jest.resetAllMocks();
  }
});

test('returns the exhausted five-hour window alongside remaining weekly quota', () => {
  expect(
    parseWeeklyLimit(
      {
        rateLimits: {
          primary: { usedPercent: 100, windowDurationMins: 300, resetsAt: 1790953112 },
          secondary: { usedPercent: 41, windowDurationMins: 10080, resetsAt: 1791484250 },
        },
      },
      100,
    ),
  ).toEqual({
    remainingPercent: 59,
    resetsAt: 1791484250,
    checkedAt: 100,
    shortTerm: { remainingPercent: 0, resetsAt: 1790953112 },
  });
});
