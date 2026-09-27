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
