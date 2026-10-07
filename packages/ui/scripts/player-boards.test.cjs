const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { listingState, nextBumpAt, contactLabel, boardError } = require('../src/pages/community/board-helpers.ts');
const now = Date.parse('2026-09-29T12:00:00Z');
test('expired and hidden listings cannot appear active; moderation takes priority', () => {
  const listing = { active: true, moderated: false, expiresAt: new Date(now).toISOString() };
  assert.equal(listingState(listing, now), 'expired');
  assert.equal(listingState({ ...listing, expiresAt: new Date(now + 1).toISOString() }, now), 'active');
  assert.equal(listingState({ ...listing, active: false }, now), 'hidden');
  assert.equal(listingState({ ...listing, moderated: true }, now), 'moderated');
});
test('bump availability is seven full days after the last rank change', () => {
  assert.equal(nextBumpAt({ bumpedAt: new Date(now).toISOString() }), now + 7 * 86400000);
});
test('contacts are rendered as known platform labels, never arbitrary HTML or links', () => {
  assert.equal(contactLabel('wechat'), 'WeChat');
  assert.equal(contactLabel('qqGroup'), 'QQ');
  assert.equal(contactLabel('javascript:alert(1)'), '');
});
test('unknown backend errors do not leak server content', () => {
  assert.equal(boardError('unauthorized'), 'authError');
  assert.equal(boardError('cooldown'), 'cooldownError');
  assert.equal(boardError('database password secret'), 'error');
});
const { editableDraft, publicQuery } = require('../src/pages/community/board-helpers.ts');
test('editing a listing only submits draft fields and does not mutate the original contacts', () => {
  const listing = {
    id: 'abc',
    userID: 'owner',
    name: 'Name',
    avatar: 'merlin',
    active: true,
    moderated: false,
    createdAt: 'yesterday',
    bumpedAt: 'today',
    expiresAt: 'tomorrow',
    kind: 'solo',
    otherLanguage: '',
    languages: ['cmn'],
    scheduleEnabled: true,
    days: [1],
    startHour: 19,
    endHour: 22,
    timeZone: 'Asia/Shanghai',
    communication: 'text',
    experience: 'beginner',
    beginnerFriendly: true,
    canTeach: false,
    groupSize: 1,
    groupName: '',

    contacts: [{ type: 'wechat', value: 'player' }],
  };
  const draft = editableDraft(listing);
  assert.equal('userID' in draft, false);
  assert.equal('id' in draft, false);
  assert.equal('active' in draft, false);
  assert.equal('expiresAt' in draft, false);
  draft.contacts[0].value = 'changed';
  draft.languages.push('en');
  assert.equal(listing.contacts[0].value, 'player');
  assert.deepEqual(listing.languages, ['cmn']);
});
test('all-languages query omits the language filter', () => {
  assert.equal(publicQuery('solo', '', 1), '?kind=solo&page=1');
  assert.equal(publicQuery('group', 'cmn', 2), '?kind=group&page=2&language=cmn');
});
test('production nginx proxies the board API to the backend', () => {
  const nginx = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../../nginx.conf'), 'utf8');
  assert.match(nginx, /location\s+\^~\s+\/api\/player-boards\s*\{[^}]*proxy_pass\s+http:\/\/\$avalon_backend;/);
});
const { boardClientError } = require('../src/pages/community/board-helpers.ts');
test('network and timeout failures always have localized recovery copy', () => {
  assert.equal(boardClientError(new TypeError('Failed to fetch')), 'error');
  assert.equal(boardClientError(new Error('The operation was aborted due to timeout')), 'error');
  assert.equal(boardClientError(new Error('cooldownError')), 'cooldownError');
  assert.equal(boardClientError(new Error('SecretDatabaseName')), 'error');
});

test('communication and beginner filters are sent with pagination instead of filtering one page locally', () => {
  assert.equal(
    publicQuery('group', 'ru', 2, 'voice', true),
    '?kind=group&page=2&language=ru&communication=voice&beginnerFriendly=1',
  );
  assert.equal(publicQuery('solo', '', 1, 'text', true), '?kind=solo&page=1&communication=text');
});

test('contact hints compile in every locale and keep the Telegram username example', () => {
  const { createI18n } = require('vue-i18n');
  const { baseCompile } = require('@intlify/message-compiler');
  const { playerBoards } = require('../src/i18n/langs/pages/playerBoards.ts');
  for (const [locale, messages] of Object.entries(playerBoards)) {
    const i18n = createI18n({ legacy: false, locale, messages: { [locale]: messages } });
    for (const key of Object.keys(messages).filter((key) => /^(accountHelp_|inviteHelp_)/.test(key))) {
      baseCompile(messages[key], {
        onError(error) {
          throw error;
        },
      });
      assert.ok(i18n.global.t(key).length > 0);
    }
    assert.match(i18n.global.t('accountHelp_telegram'), /@avalon_player/);
  }
});
