import { validPacket } from './validation';
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
  expect(validPacket('configureAiCodex', ['room', { model: 'gpt-6-luna', reasoning: 'high' }, () => {}])).toBe(true);
  expect(validPacket('getAiCodexModels', [])).toBe(false);
  expect(validPacket('configureAiCodex', ['room', { model: 'gpt-6-luna', reasoning: 'high' }])).toBe(false);
});

test('AI profile history cursor is bounded and allowed only for AI profiles', () => {
  expect(validPacket('getPlayerGameSummariesPage', ['avalon-agent-3', 'ai:YWJj', () => {}])).toBe(true);
  expect(validPacket('getPlayerGameSummariesPage', ['human', 'ai:YWJj', () => {}])).toBe(false);
  expect(validPacket('getPlayerGameSummariesPage', ['avalon-agent-3', 'ai:' + 'a'.repeat(601), () => {}])).toBe(false);
});
