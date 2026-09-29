import { validateBoardDraft } from './validation';
const draft = {
  kind: 'group',
  otherLanguage: '',
  languages: ['cmn'],
  scheduleEnabled: true,
  days: [1],
  startHour: 18,
  endHour: 22,
  timeZone: 'Asia/Taipei',
  communication: 'either',
  experience: 'experienced',
  beginnerFriendly: true,
  canTeach: true,
  groupSize: 4,

  contacts: [{ type: 'line', value: 'avalon' }],
};
test('group names support Chinese and are trimmed', () => {
  expect(validateBoardDraft({ ...draft, groupName: '  台北 Avalon  ' }, 'group').groupName).toBe('台北 Avalon');
});
test.each([undefined, '', '  ', 'a'.repeat(61), 'bad\nname', 42])(
  'rejects invalid supplied group name %p',
  (groupName) => {
    expect(() => validateBoardDraft({ ...draft, groupName }, 'group')).toThrow();
  },
);
test('solo listings cannot advertise beginner friendliness or group names', () => {
  const result = validateBoardDraft({ ...draft, kind: 'solo', groupName: 'Ignored' }, 'solo');
  expect(result.beginnerFriendly).toBe(false);
  expect(result.groupName).toBe('');
});
test('optional schedule accepts no days and normalizes unused values', () => {
  const result = validateBoardDraft(
    { ...draft, groupName: 'Avalon', scheduleEnabled: false, days: [], startHour: 0, endHour: 0, timeZone: '' },
    'group',
  );
  expect(result).toMatchObject({ scheduleEnabled: false, days: [], startHour: 0, endHour: 0, timeZone: '' });
});
test('enabled schedule still requires days and a valid time range', () => {
  expect(() => validateBoardDraft({ ...draft, groupName: 'Avalon', scheduleEnabled: true, days: [] }, 'group')).toThrow(
    'invalid_days',
  );
});
test.each([
  ['discord', 'https://discord.gg/Avalon'],
  ['discord', 'https://discord.com/invite/Avalon'],
  ['telegram', 'https://t.me/+abc_123'],
  ['telegram', 'https://t.me/avalon_group'],
  ['line', 'https://line.me/R/ti/g/abc123'],
  ['qqGroup', 'https://jq.qq.com/?_wv=1027&k=abc123'],
])('accepts group invitation %s %s', (type, value) => {
  expect(
    validateBoardDraft({ ...draft, groupName: 'Avalon', contacts: [{ type, value }] }, 'group').contacts[0].value,
  ).toBe(value);
  expect(() =>
    validateBoardDraft({ ...draft, kind: 'solo', groupName: '', contacts: [{ type, value }] }, 'solo'),
  ).toThrow();
});
test.each([
  'https://discord.gg.evil.test/code',
  'https://evil.test/discord.gg/code',
  'javascript:alert(1)',
  'https://discord.gg@evil.test/code',
  'https://discord.gg:444/code',
  'https://t.me/avalon',
  'https://discord.com/login',
])('rejects unsafe or mismatched invitation %s', (value) => {
  expect(() =>
    validateBoardDraft({ ...draft, groupName: 'Avalon', contacts: [{ type: 'discord', value }] }, 'group'),
  ).toThrow('invalid_contacts');
});
test('custom language is trimmed, supports Unicode, and is cleared when unselected', () => {
  const custom = { ...draft, groupName: 'Avalon', languages: ['other'], otherLanguage: ' 日本語 ' };
  expect(validateBoardDraft(custom, 'group').otherLanguage).toBe('日本語');
  expect(validateBoardDraft({ ...custom, languages: ['en'] }, 'group').otherLanguage).toBe('');
});
test.each(['', '   ', 'https://evil.test', '<script>', 'a'.repeat(61)])(
  'rejects invalid custom language %p',
  (otherLanguage) => {
    expect(() =>
      validateBoardDraft({ ...draft, groupName: 'Avalon', languages: ['other'], otherLanguage }, 'group'),
    ).toThrow('invalid_languages');
  },
);
test.each([
  'https://discord.gg/abc?redirect=https://evil.test',
  'https://discord.gg/abc#https://evil.test',
  'https://discord.com/login/../invite/abc',
  'https://discord.gg/%2e%2e/abc',
  'https://discord.gg/abc?url=evil.test',
])('rejects disguised or redirect-bearing invitation %s', (value) => {
  expect(() =>
    validateBoardDraft({ ...draft, groupName: 'Avalon', contacts: [{ type: 'discord', value }] }, 'group'),
  ).toThrow('invalid_contacts');
});
