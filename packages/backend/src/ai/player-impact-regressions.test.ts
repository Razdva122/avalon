import { parseDecisionReply, type BotRequest } from './client';
import { safePublicSpeech, decisionPipeline } from './pipeline';

const request = {
  playerID: 'bot',
  readAllChat: true,
  humanPlayerIDs: ['human'],
  name: '1',
  speak: true,
  choices: ['approve', 'reject'],
  chat: [{ id: 'human-message', name: '2', text: 'I trust 3.' }],
  state: {
    stage: 'selectTeam',
    players: [
      { id: 'bot', index: 1, role: 'percival', features: {} },
      { id: 'human', index: 2, role: 'unknown', features: {} },
      { id: 'other', index: 3, role: 'unknown', features: {} },
    ],
  },
} as unknown as BotRequest;
const reply = { choice: 'approve', speech: '', publicReason: '', evidence: [], claimMorgana: null, claimStances: [] };

test.each([
  'We should avoid 2 to secure a success.',
  'We must avoid failure and achieve success.',
  'We should avoid their team to secure a success.',
  'Избежим провала и добьёмся успеха.',
  'Предотвратим саботаж, чтобы добиться успеха.',
  '避免讓2進隊，才能確保成功。',
])('ordinary success-seeking speech does not pause the pipeline: %s', async (publicReason) => {
  await expect(
    decisionPipeline(async () => ({ choice: 0, speech: 'Private reason.', publicReason }))({
      ...request,
      publicDiscussion: true,
    }),
  ).resolves.toMatchObject({ choice: 0, speech: publicReason });
});

test.each([
  'My role is Percival; I suspect 3 is Morgana.',
  'Моя роль — Персиваль, третьего считаю Морганой.',
  'Mi rol es Percival. 3 es Morgana.',
  'Vai trò của tôi là Percival. 3 là Morgana.',
  '我的角色是派西維爾，3是莫甘娜。',
])('an explicitly permitted Percival claim passes without disabling other leak checks: %s', (speech) => {
  expect(safePublicSpeech(speech, 'approve', 'en', true)).toBe(speech);
  expect(() => safePublicSpeech(speech, 'approve', 'en', false)).toThrow();
  expect(() => safePublicSpeech(speech + ' My role is Merlin.', 'approve', 'en', true)).toThrow();
});

test.each([
  'I intend to prevent success.',
  "I reject to prevent this mission's success.",
  'I want to prevent their success.',
  'I reject to avoid the risk of an unintended success.',
  'Нужно избежать случайного успеха.',
  'Нужно предотвратить успех миссии.',
  'Нужно предотвратить их успех.',
  '避免讓任務意外成功。',
  '我要避免這輪任務成功。',
])('actual sabotage intent remains blocked: %s', (speech) => {
  expect(() => safePublicSpeech(speech, 'reject')).toThrow();
});

test('identical claim positions collapse to one, but contradictory positions still fail', () => {
  const trust = { seat: 2, stance: 'trust' };
  expect(
    parseDecisionReply(JSON.stringify({ ...reply, claimStances: [trust, trust] }), request.choices, request)
      .claimStances,
  ).toEqual([trust]);
  expect(() =>
    parseDecisionReply(
      JSON.stringify({ ...reply, claimStances: [trust, { seat: 2, stance: 'distrust' }] }),
      request.choices,
      request,
    ),
  ).toThrow();
  expect(() =>
    parseDecisionReply(
      JSON.stringify({ ...reply, claimStances: [{ seat: 8, stance: 'trust' }] }),
      request.choices,
      request,
    ),
  ).toThrow();
});

test('duplicate memory anchors collapse without accepting zero or another author', () => {
  const r = { ...request, memoryOnly: true, choices: ['observe'] };
  const note = { key: 't:2:trust', kind: 'testimony', fact: '2 trusts 3.', source: [-1, -1], certainty: 'claim' };
  const raw = (evidence: unknown[]) => JSON.stringify({ ...reply, choice: 'observe', evidence });
  expect(parseDecisionReply(raw([note]), r.choices, r).evidence).toEqual([{ ...note, source: 'recent:1' }]);
  expect(() => parseDecisionReply(raw([{ ...note, source: [0] }]), r.choices, r)).toThrow();
  expect(() => parseDecisionReply(raw([{ ...note, key: 't:3:trust' }]), ['observe'], request)).toThrow();
});

test('runtime text limits count the same Unicode characters as the output schema', () => {
  const text = 'x'.repeat(239) + '😀';
  const raw = JSON.stringify({
    ...reply,
    speech: text,
    publicReason: text,
    evidence: [
      {
        key: 'x'.repeat(59) + '😀',
        kind: 'fact',
        fact: text,
        source: 'x'.repeat(159) + '😀',
        certainty: 'claim',
      },
    ],
  });
  expect(parseDecisionReply(raw, request.choices, request)).toMatchObject({ speech: text, publicReason: text });
  expect(() =>
    parseDecisionReply(JSON.stringify({ ...reply, speech: text + 'x' }), request.choices, request),
  ).toThrow();
});
