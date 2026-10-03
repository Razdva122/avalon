import { validPacket } from './validation';

test.each(['en', 'ru', 'zh-tw'])('accepts AI creation options with %s and an acknowledgement', (language) => {
  expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language }, () => {}])).toBe(true);
});

test.each([5, 6, 7, 8])('accepts %i AI players in every discussion language', (playerCount) => {
  for (const language of ['en', 'ru', 'zh-tw'])
    expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language, playerCount }, () => {}])).toBe(true);
});

test.each([0, 4, 9, 10, 5.5, '5', null, undefined, {}, [], NaN, Infinity])(
  'rejects unsupported or malformed AI player counts %#',
  (playerCount) => {
    expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language: 'ru', playerCount }, () => {}])).toBe(
      false,
    );
  },
);

test('AI creation keeps the legacy model-only packet and requires the acknowledgement', () => {
  expect(validPacket('createAiRoom', ['codex-chatgpt', () => {}])).toBe(true);
  expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language: 'ru' }])).toBe(false);
  expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language: 'ru' }, 'not-a-callback'])).toBe(false);
});

test.each([
  null,
  [],
  {},
  { model: 'codex-chatgpt' },
  { language: 'ru' },
  { model: 7, language: 'ru' },
  { model: '', language: 'ru' },
  { model: 'a'.repeat(255), language: 'ru' },
  { model: { $ne: null }, language: 'ru' },
  { model: 'codex-chatgpt', language: 'zh-cn' },
  { model: 'codex-chatgpt', language: ['ru'] },
  { model: 'codex-chatgpt', language: 'ru', extra: true },
  Object.assign(Object.create({ language: 'ru' }), { model: 'codex-chatgpt' }),
])('rejects malformed AI creation options %#', (options) => {
  expect(validPacket('createAiRoom', [options, () => {}])).toBe(false);
});

test.each([
  ['voteForMission', ['room', 'bogus']],
  ['voteForMission', ['room', undefined]],
  ['preVote', ['room', 'abstain', 'card']],
  ['startCustomTimer', ['room']],
  ['startCustomTimer', ['room', '60']],
  ['addCustomTimerTime', ['room', -1]],
  ['actionOnMission', ['room', 'bogus']],
])('rejects invalid gameplay arguments for %s', (event, args) => {
  expect(validPacket(event, args)).toBe(false);
});
test.each([
  ['voteForMission', ['room', 'approve']],
  ['preVote', ['room', 'reject', 'card']],
  ['startCustomTimer', ['room', 60]],
  ['addCustomTimerTime', ['room', 30]],
  ['actionOnMission', ['room', 'fail']],
])('accepts legitimate gameplay arguments for %s', (event, args) => {
  expect(validPacket(event, args)).toBe(true);
});
test('premium avatar IDs keep their catalog slash', () => {
  expect(validPacket('updateUserAvatar', ['premium/eclipse-queen', () => {}])).toBe(true);
});

test('Codex catalog and configuration packets accept their required acknowledgements', () => {
  expect(validPacket('getAiCodexModels', [() => {}])).toBe(true);
  expect(validPacket('getAiCodexWeeklyLimit', [() => {}])).toBe(true);
  expect(validPacket('getAiCodexWeeklyLimit', [])).toBe(false);
  expect(validPacket('configureAiCodex', ['room', { model: 'gpt-6-luna', reasoning: 'high' }, () => {}])).toBe(true);
  expect(validPacket('getAiCodexModels', [])).toBe(false);
  expect(validPacket('configureAiCodex', ['room', { model: 'gpt-6-luna', reasoning: 'high' }])).toBe(false);
});

test('AI profile history cursor is bounded and allowed only for AI profiles', () => {
  expect(validPacket('getPlayerGameSummariesPage', ['avalon-agent-3', 'ai:YWJj', () => {}])).toBe(true);
  expect(validPacket('getPlayerGameSummariesPage', ['human', 'ai:YWJj', () => {}])).toBe(false);
  expect(validPacket('getPlayerGameSummariesPage', ['avalon-agent-3', 'ai:' + 'a'.repeat(601), () => {}])).toBe(false);
});
