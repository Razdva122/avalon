import { compactRequest, systemFor } from './client';
import { decisionPipeline, focusedRetry } from './pipeline';
import type { BotRequest } from './client';

const base = {
  playerID: '1',
  name: '1',
  style: 'Diplomatic, prefers concrete compromises.',
  task: 'Vote',
  speak: true,
  choices: ['approve', 'reject'],
  state: {
    stage: 'votingForTeam',
    players: [{ id: '1', index: 1, role: 'merlin', features: {} }],
  },
  chat: [{ name: '2', text: '1, why would you replace 3 after that mission?' }],
} as unknown as BotRequest;

test.each([
  ['ru', 'RUSSIAN ONLY', 'Это компромисс после первой миссии. 2, какую замену ты предлагаешь?'],
  ['zh-tw', 'TRADITIONAL CHINESE', '這是第一輪任務後的折衷方案。2，你建議換誰？'],
])(
  'uses %s for decision, public reply, retry, council and review without exposing private context',
  async (language, instruction, speech) => {
    const request = { ...base, language } as BotRequest;
    const generate = jest
      .fn()
      .mockResolvedValueOnce({ choice: 1, speech: 'PRIVATE ROLE KNOWLEDGE', publicReason: speech })
      .mockResolvedValueOnce({ choice: 0, speech });
    const result = await decisionPipeline(generate)(request);
    expect(result).toMatchObject({ choice: 1, speech, privateReason: 'PRIVATE ROLE KNOWLEDGE' });
    for (const [, options] of generate.mock.calls) {
      expect(options.instructions).toContain(instruction);
      expect(options.instructions).not.toContain('ENGLISH ONLY');
      expect(options.context.language).toBe(language);
    }
    const publicOptions = generate.mock.calls[1][1];
    expect(publicOptions.context).toMatchObject({ personality: base.style, publicReason: speech });
    expect(publicOptions.context.chat).toEqual([{ by: '2', text: base.chat[0].text }]);
    expect(JSON.stringify(publicOptions.context)).not.toMatch(/merlin|PRIVATE ROLE KNOWLEDGE/);
    expect(focusedRetry(generate.mock.calls[0][1]).instructions).toContain(instruction);
    expect(
      systemFor({ ...request, privateDiscussion: true, state: { ...request.state, stage: 'assassinate' } }),
    ).toContain(instruction);
    const review = jest.fn().mockResolvedValue({ choice: 0, speech });
    await decisionPipeline(review)({ ...request, state: { ...request.state, stage: 'end' } });
    expect(review.mock.calls[0][1].instructions).toContain(instruction);
    expect(review.mock.calls[0][1].context.language).toBe(language);
  },
);

test.each([
  ['ru', 'Я Мерлин.', 'Нужны более веские основания для поддержки этой команды.'],
  ['ru', 'Я хочу саботировать эту миссию.', 'Нужны более веские основания для поддержки этой команды.'],
  ['zh-tw', '我是梅林。', '我需要更充分的理由才會支持這支隊伍。'],
  ['zh-tw', '我要破壞這次任務。', '我需要更充分的理由才會支持這支隊伍。'],
])('replaces unsafe public %s speech with a localized neutral statement', async (language, unsafe, neutral) => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'Private.', publicReason: unsafe })
    .mockResolvedValueOnce({ choice: 0, speech: unsafe });
  const result = await decisionPipeline(generate)({ ...base, language } as BotRequest);
  expect(result.speech).toBe(neutral);
  expect(generate.mock.calls[1][1].context.publicReason).toBe(neutral);
});

test('legacy requests keep English and selected language does not change legal choices', () => {
  expect(systemFor(base)).toContain('ENGLISH ONLY');
  expect(compactRequest(base)).toMatchObject({ language: 'en', choices: ['approve', 'reject'] });
  expect(compactRequest({ ...base, language: 'zh-tw' } as BotRequest).choices).toEqual(base.choices);
});

test('keeps a question available across a full table turn so its addressee can answer', () => {
  const chat = [
    ...base.chat,
    ...Array.from({ length: 7 }, (_, i) => ({ name: String(i + 1), text: 'A later comment.' })),
  ];
  expect(compactRequest({ ...base, chat }).chat).toContainEqual({ by: '2', text: base.chat[0].text });
});

test.each([
  ['ru', 'Я предлагаю [1, 2].', 'Я выбираю команду [1, 3].'],
  ['zh-tw', '我提議 [1，2]。', '我選擇 [1、3]。'],
])(
  'repairs an explicit selected-roster contradiction in %s before applying it',
  async (language, inconsistent, corrected) => {
    const request = {
      ...base,
      language,
      speak: false,
      choices: ['1, 2', '1, 3'],
      state: { ...base.state, stage: 'selectTeam' },
    } as BotRequest;
    const generate = jest
      .fn()
      .mockResolvedValueOnce({ choice: 1, speech: inconsistent })
      .mockResolvedValueOnce({ choice: 1, speech: corrected });
    expect((await decisionPipeline(generate)(request)).choice).toBe(1);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1][1].phase).toBe('decision-repair');
  },
);
