import { claimContext, claimSpeech } from './claims';
import type { BotRequest, BotReply } from './client';
const request = (role = 'merlin', stage = 'selectTeam') =>
  ({
    playerID: 'a',
    speak: true,
    state: {
      stage,
      players: [
        { id: 'a', index: 1, role },
        { id: 'b', index: 2, role: 'unknown' },
        { id: 'c', index: 3, role: 'unknown' },
      ],
    },
    chat: [{ name: '2', text: 'I vote reject. I am Percival. 3 is Morgana. Include me in missions and exclude 3.' }],
  }) as unknown as BotRequest;
test('claims are testimony available to everyone, while only eligible roles can make one', () => {
  expect(claimContext(request()).targets).toEqual([2, 3]);
  expect(claimContext(request('servant')).targets).toEqual([]);
  expect(claimContext(request('mordred', 'onMission')).claimants).toEqual([]);
  expect(claimContext(request()).claims).toEqual([{ by: 2, target: 3, status: 'claim' }]);
  expect(claimContext(request()).claimants).toEqual([2]);
});
test('a public turn requires a stance on other claims and allows an intentional Percival claim', () => {
  const reply = { choice: 0, speech: '', claimMorgana: 3, claimStances: [{ seat: 2, stance: 'distrust' }] } as BotReply;
  expect(claimSpeech(request(), reply)).toContain("I distrust 2's Percival claim.");
  expect(claimSpeech(request(), reply)).toContain('I am Percival. 3 is Morgana.');
  expect(() => claimSpeech(request('servant'), reply)).toThrow();
  expect(() => claimSpeech(request(), { choice: 0, speech: '' })).toThrow();
  expect(() => claimSpeech(request(), { ...reply, claimMorgana: 1 })).toThrow();
});

test('past public positions survive recent-chat truncation, and private turns require no response', () => {
  const r = request();
  r.chat.push({ name: '1', text: "I trust 2's Percival claim." });
  expect(claimContext(r).previousStances).toEqual([{ seat: 2, stance: 'trust' }]);
  expect(claimSpeech({ ...r, speak: false }, { choice: 0, speech: '' })).toBe('');
  expect(claimSpeech({ ...r, privateDiscussion: true }, { choice: 0, speech: '' })).toBe('');
  expect(() =>
    claimSpeech(r, {
      choice: 0,
      speech: '',
      claimStances: [
        { seat: 2, stance: 'trust' },
        { seat: 2, stance: 'distrust' },
      ],
    }),
  ).toThrow();
});

const localizedClaims = [
  {
    language: 'en',
    claim: 'I am Percival. 3 is Morgana. Include me in missions and exclude 3.',
    trust: "I trust 2's Percival claim.",
    distrust: "I distrust 2's Percival claim.",
  },
  {
    language: 'ru',
    claim: 'Я Персиваль. 3 — Моргана. Включайте меня в миссии и исключайте 3.',
    trust: 'Я доверяю заявлению 2 о роли Персиваля.',
    distrust: 'Я не доверяю заявлению 2 о роли Персиваля.',
  },
  {
    language: 'zh-tw',
    claim: '我是派西維爾。3 是莫甘娜。請讓我參加任務，排除 3。',
    trust: '我相信 2 的派西維爾聲明。',
    distrust: '我不相信 2 的派西維爾聲明。',
  },
] as const;

test.each(localizedClaims)('$language claims and stances support the eighth seat', ({ language, claim, distrust }) => {
  const r = {
    ...request(),
    language,
    state: {
      ...request().state,
      players: Array.from({ length: 8 }, (_, i) => ({
        id: i === 0 ? 'a' : `seat-${i + 1}`,
        index: i + 1,
        role: i === 0 ? 'merlin' : 'unknown',
      })),
    },
    chat: [
      { name: '2', text: claim.replace(/\b3\b/g, '8') },
      { name: '8', text: claim },
      { name: '1', text: distrust.replace(/\b2\b/g, '8') },
    ],
  } as BotRequest;
  expect(claimContext(r)).toMatchObject({
    claims: [
      { by: 2, target: 8, status: 'claim' },
      { by: 8, target: 3, status: 'claim' },
    ],
    claimants: [2, 8],
    previousStances: [{ seat: 8, stance: 'distrust' }],
  });
  const speech = claimSpeech(r, {
    choice: 0,
    speech: '',
    claimMorgana: 8,
    claimStances: [
      { seat: 2, stance: 'distrust' },
      { seat: 8, stance: 'distrust' },
    ],
  });
  expect(speech).toContain(claim.replace(/\b3\b/g, '8'));
  expect(speech).toContain(distrust.replace(/\b2\b/g, '8'));
});

test.each(localizedClaims)(
  'server claim and stance speech follows $language',
  ({ language, claim, trust, distrust }) => {
    const r = { ...request(), language } as BotRequest;
    for (const [stance, text] of [
      ['trust', trust],
      ['distrust', distrust],
    ] as const) {
      expect(claimSpeech(r, { choice: 0, speech: '', claimMorgana: 3, claimStances: [{ seat: 2, stance }] })).toBe(
        `${text} ${claim}`,
      );
    }
  },
);

test.each(localizedClaims)(
  '$language claims and revised stances remain public testimony in any room language',
  ({ claim, trust, distrust }) => {
    for (const language of ['en', 'ru', 'zh-tw']) {
      const r = {
        ...request(),
        language,
        chat: [
          { name: '2', text: `A public reason. ${claim}` },
          { name: '1', text: trust },
          { name: '1', text: distrust },
          { name: '3', text: trust },
        ],
      } as BotRequest;
      const context = claimContext(r);
      expect(context.claims).toEqual([{ by: 2, target: 3, status: 'claim' }]);
      expect(context.claimants).toEqual([2]);
      expect(context.previousStances).toEqual([{ seat: 2, stance: 'distrust' }]);
      r.chat.push({ name: '1', text: trust });
      expect(claimContext(r).previousStances).toEqual([{ seat: 2, stance: 'trust' }]);
    }
  },
);
