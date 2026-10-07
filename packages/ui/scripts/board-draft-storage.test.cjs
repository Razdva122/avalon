const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { readBoardDraft, writeBoardDraft, clearBoardDraft } = require('../src/pages/community/board-form-session.ts');
const fallback = {
  kind: 'solo',
  groupName: '',
  languages: [],
  otherLanguage: '',
  days: [],
  scheduleEnabled: false,
  startHour: 19,
  endHour: 22,
  timeZone: 'UTC',
  communication: 'either',
  experience: 'beginner',
  beginnerFriendly: false,
  canTeach: false,
  groupSize: 1,
  memberIDs: [],
  contacts: [{ type: 'discord', value: '' }],
};
function storage() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
}
test('drafts retain incomplete input for one account and kind and clear after publication', () => {
  const s = storage();
  const draft = { ...fallback, languages: ['ru'], contacts: [{ type: 'discord', value: 'unfinished_' }] };
  writeBoardDraft('alice:solo:new', draft, s);
  assert.deepEqual(readBoardDraft('alice:solo:new', fallback, s), draft);
  assert.equal(readBoardDraft('bob:solo:new', fallback, s), null);
  assert.equal(readBoardDraft('alice:group:new', { ...fallback, kind: 'group' }, s), null);
  clearBoardDraft('alice:solo:new', s);
  assert.equal(readBoardDraft('alice:solo:new', fallback, s), null);
});
test('corrupt, wrong-kind and malformed drafts cannot replace the form state', () => {
  const s = storage();
  for (const raw of [
    '{',
    JSON.stringify({ ...fallback, kind: 'group' }),
    JSON.stringify({ ...fallback, contacts: null }),
    JSON.stringify({ ...fallback, days: 'Monday' }),
  ]) {
    s.setItem('avalon:board-draft:alice:solo:new', raw);
    assert.equal(readBoardDraft('alice:solo:new', fallback, s), null);
  }
});
test('blocked storage does not break rendering, typing or successful publication', () => {
  const s = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
    removeItem() {
      throw Error('blocked');
    },
  };
  assert.equal(readBoardDraft('alice:solo:new', fallback, s), null);
  assert.equal(writeBoardDraft('alice:solo:new', fallback, s), false);
  assert.doesNotThrow(() => clearBoardDraft('alice:solo:new', s));
});

test('an unfinished numeric field does not discard the rest of a team draft', () => {
  const s = storage();
  const group = { ...fallback, kind: 'group', groupSize: 4 };
  const unfinished = { ...group, groupName: 'My team', groupSize: '' };
  writeBoardDraft('alice:group:new', unfinished, s);
  assert.deepEqual(readBoardDraft('alice:group:new', group, s), unfinished);
});

test('a draft made before choosing a contact platform is restored', () => {
  const s = storage();
  const draft = { ...fallback, contacts: [], languages: ['ru'] };
  writeBoardDraft('alice:solo:new', draft, s);
  assert.deepEqual(readBoardDraft('alice:solo:new', fallback, s), draft);
});
