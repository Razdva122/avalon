import { validPacket } from './validation';

test('human preparation accepts only its acknowledgement', () => {
  expect(validPacket('createHumanAiRoom', [() => {}])).toBe(true);
  expect(validPacket('createHumanAiRoom', [{ difficulty: 'regular', language: 'ru' }, () => {}])).toBe(false);
});

test.each(['smart', 'regular'])('accepts the fixed human start mode %s', (difficulty) => {
  expect(validPacket('startHumanAiRoom', ['room', { difficulty, language: 'ru' }, () => {}])).toBe(true);
});

test.each([
  { difficulty: 'custom', language: 'ru' },
  { difficulty: 'smart', language: 'ru', model: 'gpt-6.1-sol' },
  { difficulty: 'smart', language: 'ru', playerCount: 9 },
  { difficulty: 'regular', language: 'zh-cn' },
  null,
])('rejects malformed or customized public bot creation %#', (options) => {
  expect(validPacket('startHumanAiRoom', ['room', options, () => {}])).toBe(false);
});

test.each(['en', 'ru', 'zh-tw', 'es', 'vi'])(
  'accepts AI creation options with %s and an acknowledgement',
  (language) => {
    expect(validPacket('createAiRoom', [{ model: 'codex-chatgpt', language }, () => {}])).toBe(true);
  },
);

test.each([5, 6, 7, 8])('accepts %i AI players in every discussion language', (playerCount) => {
  for (const language of ['en', 'ru', 'zh-tw', 'es', 'vi'])
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

test('joining an AI human seat requires exactly a room ID and acknowledgement', () => {
  expect(validPacket('joinAiRoom', ['mixed-room', () => {}])).toBe(true);
  expect(validPacket('joinAiRoom', ['mixed-room'])).toBe(false);
  expect(validPacket('joinAiRoom', ['mixed-room', 'forged-user', () => {}])).toBe(false);
  expect(validPacket('joinAiRoom', [['mixed-room'], () => {}])).toBe(false);
});

test('accepts beginner preparation and supported public table sizes', () => {
  expect(validPacket('createHumanAiRoom', [{ beginner: true }, () => {}])).toBe(true);
  for (const playerCount of [5, 6, 7, 8])
    expect(
      validPacket('startHumanAiRoom', ['room', { difficulty: 'regular', language: 'ru', playerCount }, () => {}]),
    ).toBe(true);
});

test('friend room creation accepts a boolean mode and rejects malformed and beginner combinations', () => {
  expect(validPacket('createHumanAiRoom', [{ beginner: false, withFriend: true }, () => {}])).toBe(true);
  expect(validPacket('createHumanAiRoom', [{ beginner: false, withFriend: 'yes' }, () => {}])).toBe(false);
  expect(validPacket('createHumanAiRoom', [{ beginner: true, withFriend: true }, () => {}])).toBe(false);
});

test('unified bot setup passes packet validation for all supported modes and sizes', () => {
  for (const difficulty of ['regular', 'smart'])
    for (const withFriend of [false, true])
      for (const playerCount of [5, 6, 7, 8])
        for (const language of ['en', 'ru', 'zh-tw', 'es', 'vi'])
          expect(
            validPacket('createHumanAiRoom', [
              { beginner: false, withFriend, difficulty, language, playerCount },
              () => {},
            ]),
          ).toBe(true);
  expect(
    validPacket('createHumanAiRoom', [
      { beginner: true, withFriend: false, difficulty: 'regular', language: 'en', playerCount: 5 },
      () => {},
    ]),
  ).toBe(true);
});

test.each([
  { difficulty: 'unknown' },
  { language: 'xx' },
  { playerCount: '7' },
  { playerCount: 9 },
  { unknown: true },
  { beginner: true, difficulty: 'smart' },
  { beginner: true, playerCount: 6 },
])('unified bot setup rejects malformed options %j', (invalid) => {
  expect(
    validPacket('createHumanAiRoom', [
      { beginner: false, withFriend: false, difficulty: 'regular', language: 'en', playerCount: 5, ...invalid },
      () => {},
    ]),
  ).toBe(false);
});

test.each([2, 3, 4])('friends setup accepts %i human seats', (humanSeats) => {
  expect(validPacket('createHumanAiRoom', [{ beginner: false, withFriend: true, humanSeats }, () => {}])).toBe(true);
});

test.each([0, 1, 5, 2.5, '3', null])('friends setup rejects invalid human seats %j', (humanSeats) => {
  expect(validPacket('createHumanAiRoom', [{ beginner: false, withFriend: true, humanSeats }, () => {}])).toBe(false);
});

test('solo and beginner setup cannot reserve friends', () => {
  expect(validPacket('createHumanAiRoom', [{ beginner: false, humanSeats: 3 }, () => {}])).toBe(false);
  expect(validPacket('createHumanAiRoom', [{ beginner: true, withFriend: true, humanSeats: 3 }, () => {}])).toBe(false);
});

test.each(['es', 'vi'])('accepts %s for public AI launch packets', (language) => {
  expect(validPacket('startHumanAiRoom', ['room', { difficulty: 'regular', language }, () => {}])).toBe(true);
});
