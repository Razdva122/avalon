import { configuredCodexInstances, codexEnvironment, withCodexInstance } from './codex-instances';

const environment = { ...process.env };
afterEach(() => {
  process.env = { ...environment };
});

test('parallel account contexts retain their own profile after interleaved async work without changing process.env', async () => {
  process.env.AI_CODEX_HOME = '/legacy';
  process.env.AI_CODEX_SSH_HOST = 'legacy.example';
  process.env.AI_CODEX_INSTANCES = JSON.stringify([
    { id: 'one', home: '/one' },
    { id: 'two', home: '/two' },
  ]);
  const instances = configuredCodexInstances();
  const results = await Promise.all(
    instances.map((instance) =>
      withCodexInstance(instance, async () => {
        await new Promise<void>((done) => setImmediate(done));
        return [codexEnvironment().AI_CODEX_HOME, codexEnvironment().AI_CODEX_SSH_HOST];
      }),
    ),
  );
  expect(results).toEqual([
    ['/one', undefined],
    ['/two', undefined],
  ]);
  expect(process.env.AI_CODEX_HOME).toBe('/legacy');
  expect(codexEnvironment().AI_CODEX_SSH_HOST).toBe('legacy.example');
});

test.each([
  '',
  'null',
  '{}',
  '[]',
  JSON.stringify([{ id: 'default', home: '/one' }]),
  JSON.stringify([{ id: 'one', home: 'relative' }]),
  JSON.stringify([
    { id: 'one', home: '/one' },
    { id: 'one', home: '/two' },
  ]),
  JSON.stringify([
    { id: 'one', home: '/one' },
    { id: 'two', home: '/one/../one' },
  ]),
  JSON.stringify([{ id: 'one', home: '/one', ssh: {} }]),
  JSON.stringify([{ id: 'one', home: '/one', typo: true }]),
  JSON.stringify([{ id: 'one', ssh: { host: '-option' } }]),
])('invalid instance configuration fails closed: %s', (raw) => {
  process.env.AI_CODEX_INSTANCES = raw;
  expect(() => configuredCodexInstances()).toThrow('Invalid AI_CODEX_INSTANCES');
});

test('omitting pool configuration preserves the legacy connection and snapshots it for a room', () => {
  delete process.env.AI_CODEX_INSTANCES;
  process.env.AI_CODEX_HOME = '/original';
  const instance = configuredCodexInstances()[0];
  process.env.AI_CODEX_HOME = '/changed';
  expect(instance.id).toBe('default');
  expect(withCodexInstance(instance, () => codexEnvironment().AI_CODEX_HOME)).toBe('/original');
});

test('account game capacity is explicit and preserves a single quota identity', () => {
  process.env.AI_CODEX_INSTANCES = JSON.stringify([
    { id: 'one', home: '/one', maxGames: 2 },
    { id: 'two', home: '/two' },
  ]);
  const instances = configuredCodexInstances();
  expect(instances.map(({ id, maxGames }) => ({ id, maxGames: maxGames ?? 1 }))).toEqual([
    { id: 'one', maxGames: 2 },
    { id: 'two', maxGames: 1 },
  ]);
});

test.each([0, 3, -1, 1.5, '2', null])('invalid per-account game capacity fails closed: %s', (maxGames) => {
  process.env.AI_CODEX_INSTANCES = JSON.stringify([{ id: 'one', home: '/one', maxGames }]);
  expect(() => configuredCodexInstances()).toThrow('Invalid AI_CODEX_INSTANCES');
});
