import { compactRequest } from './client';
import type { BotRequest } from './client';
import { decisionPipeline, publicContext } from './pipeline';

const human = { name: '2', text: 'Я персиваль 5 это моргана. 4 поддерживает походы с 5, не берите их.' };
const request = {
  playerID: 'bot',
  humanPlayerID: 'human',
  name: '1',
  style: 'brief',
  speak: true,
  task: 'Discuss the team',
  publicDiscussion: true,
  choices: ['1, 2'],
  state: {
    stage: 'selectTeam',
    mission: 0,
    vote: 0,
    history: [],
    players: Array.from({ length: 7 }, (_, i) => ({
      id: i === 0 ? 'bot' : i === 1 ? 'human' : `seat-${i + 1}`,
      index: i + 1,
      role: i === 0 ? 'servant' : 'unknown',
      features: {},
    })),
  },
  chat: [human, ...Array.from({ length: 30 }, () => ({ name: '3', text: 'Предпочитаю 3, 4.' }))],
} as unknown as BotRequest;

test('human warnings and free-form role testimony survive bot chatter without text classification', () => {
  const expected = {
    humanStatements: [{ id: 1, by: 2, text: human.text }],
    publicRoleClaims: [],
  };
  const context = compactRequest(request);
  expect(context).toMatchObject(expected);
  expect(context.chat).toHaveLength(14);
  expect(context.chat).not.toContainEqual({ by: '2', text: human.text });
  expect(publicContext(request, '1, 2')).toMatchObject(expected);
  expect(JSON.stringify(publicContext(request, '1, 2'))).not.toMatch(
    /humanPlayerID|privateKnowledge|servant|"bot"|"human"/,
  );
});

test('does not permanently reserve history for an unselected opening prefix', () => {
  const current = {
    ...request,
    chat: Array.from({ length: 40 }, (_, i) => ({ name: '2', text: `${i}: ${'x'.repeat(1000)}` })),
  };
  const context = compactRequest(current);
  expect(context).toMatchObject({ humanStatements: expect.any(Array) });
  const statements = (context as unknown as { humanStatements: { text: string }[] }).humanStatements;
  expect(statements).toHaveLength(2);
  expect(statements[0].text).toMatch(/^24:/);
  expect(statements[statements.length - 1].text).toMatch(/^25:/);
  expect(context.chat![13].text).toMatch(/^39:/);
  expect([...statements, ...context.chat!]).toHaveLength(16);
  expect(statements.every((s) => s.text.endsWith('x'.repeat(1000)))).toBe(true);
});

test('preserves selected middle testimony with its correction as an ordered pair', () => {
  const chat = [
    ...Array.from({ length: 8 }, () => ({ name: '2', text: 'Привет. Как здесь голосовать?' })),
    { name: '2', text: 'Я Персиваль, 7 Мерлин.' },
    { name: '2', text: '7 точнее Моргана, оговорка.' },
    ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Недавняя реплика ${i}` })),
    ...Array.from({ length: 14 }, () => ({ name: '3', text: 'Продолжаем обсуждение.' })),
  ];
  const input = Object.assign({}, request, { chat, humanMemory: [[chat[8], chat[9]]] });
  const context = compactRequest(input);
  expect(context.humanStatements).toEqual(
    expect.arrayContaining([
      { id: 9, by: 2, text: 'Я Персиваль, 7 Мерлин.' },
      { id: 10, by: 2, text: '7 точнее Моргана, оговорка.' },
    ]),
  );
  expect(context.humanStatements!.some((m) => m.text.includes('Привет'))).toBe(false);
  expect(context.humanStatements).toHaveLength(18);
});

test('keeps a change of position without exceeding the previous serialized testimony budget', () => {
  const chat = [
    ...Array.from({ length: 8 }, () => ({ name: '2', text: ')' })),
    { name: '2', text: 'Я поддерживаю только 5,6,2. '.repeat(40) },
    { name: '2', text: 'Теперь поддерживаю 5,6,7,1. '.repeat(40) },
    ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Продолжение ${i}. `.repeat(80) })),
    ...Array.from({ length: 14 }, () => ({ name: '3', text: 'Следующая речь.' })),
  ];
  const input = Object.assign({}, request, { chat, humanMemory: [[chat[8], chat[9]]] });
  const context = compactRequest(input);
  const oldStatements = [...chat.slice(0, 8), ...chat.slice(24, 40)].map((m) => ({
    by: 2,
    text: m.text,
    status: 'claim',
  }));
  expect(context.humanStatements!.map((m) => m.text)).toEqual(expect.arrayContaining([chat[8].text, chat[9].text]));
  expect(context.humanStatements!.length).toBeLessThan(18);
  expect(Buffer.byteLength(JSON.stringify(context.humanStatements))).toBeLessThanOrEqual(
    Buffer.byteLength(JSON.stringify(oldStatements)),
  );
  expect(context.chat).toEqual(chat.slice(-14).map((m) => ({ by: m.name, text: m.text })));
});

test('model-selected testimony survives later human chatter only for the observing bot', async () => {
  const generated: ReturnType<typeof compactRequest>[] = [];
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        { key: 'claim:2', kind: 'testimony', fact: '2 claims Percival.', source: 'chat:1', certainty: 'claim' },
      ],
    };
  });
  await decide(request);
  const later = {
    ...request,
    chat: [
      ...request.chat,
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Новое сообщение ${i}.` })),
      ...request.chat.slice(1),
    ],
  };
  await decide(later);
  await decide({ ...later, playerID: 'seat-3' });
  expect(generated[1].humanStatements).toContainEqual({ id: 1, by: 2, text: human.text });
  expect(generated[2].humanStatements!.map((m) => m.text)).not.toContain(human.text);
});

test('a model cannot pin unseen future messages or bot speech as human testimony', async () => {
  const generated: ReturnType<typeof compactRequest>[] = [];
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        { key: 'bad-source', kind: 'testimony', fact: 'Unsupported.', source: 'chat:2,32', certainty: 'claim' },
      ],
    };
  });
  await decide(request);
  await decide({
    ...request,
    chat: [
      ...request.chat,
      { name: '2', text: 'Нельзя было видеть заранее.' },
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Свежая реплика ${i}.` })),
      ...request.chat.slice(1),
    ],
  });
  expect(generated[1].humanStatements!.map((m) => m.text)).not.toContain('Нельзя было видеть заранее.');
});

test('mixed-source corrections retain both the original and the newly validated quote', async () => {
  const generated: ReturnType<typeof compactRequest>[] = [];
  const correction = { name: '2', text: 'Correction: 5 is Merlin, not Morgana.' };
  let turn = 0;
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        {
          key: 'claim:2',
          kind: 'testimony',
          fact: '2 corrected the earlier role claim; unverified.',
          source: turn++ === 0 ? 'chat:1' : 'recent:6；自身角色資訊',
          certainty: 'claim',
        },
      ],
    };
  });
  await decide(request);
  const later = {
    ...request,
    chat: [
      ...request.chat,
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Новое сообщение ${i}.` })),
      ...request.chat.slice(1, 6),
      correction,
      ...request.chat.slice(1, 9),
    ],
  };
  await decide(later);
  await decide({
    ...later,
    chat: [
      ...later.chat,
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Следующее сообщение ${i}.` })),
      ...request.chat.slice(1),
    ],
  });
  expect(generated[2].humanStatements).toContainEqual(expect.objectContaining({ by: 2, text: human.text }));
  expect(generated[2].humanStatements).toContainEqual(expect.objectContaining({ by: 2, text: correction.text }));
});

test('a ninth same-key source keeps the original and latest revision within eight remembered slots', async () => {
  const generated: ReturnType<typeof compactRequest>[] = [];
  const final = { name: '2', text: 'Final correction.' };
  let turn = 0;
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        {
          key: 'claim:2',
          kind: 'testimony',
          fact: '2 revised the same claim; unverified.',
          source: turn++ === 0 ? 'chat:1,2,3,4,5,6,7,8' : 'recent:14',
          certainty: 'claim',
        },
      ],
    };
  });
  const initial = {
    ...request,
    chat: [
      human,
      ...Array.from({ length: 7 }, (_, i) => ({ name: '2', text: `Historical correction number ${i}.` })),
      ...request.chat.slice(1),
    ],
  };
  await decide(initial);
  const later = { ...request, chat: [...initial.chat, ...request.chat.slice(1, 14), final] };
  await decide(later);
  await decide({
    ...request,
    chat: [
      ...later.chat,
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Later message ${i}.` })),
      ...request.chat.slice(1),
    ],
  });
  expect(generated[2].humanStatements).toContainEqual(expect.objectContaining({ text: human.text }));
  expect(generated[2].humanStatements).toContainEqual(expect.objectContaining({ text: final.text }));
  expect(generated[2].humanStatements!.length).toBeLessThanOrEqual(24);
});

test('stable message sources survive a rolling history without binding to a different speaker', async () => {
  const original = { ...human, id: '12345678-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
  const prefix = { name: '3', text: 'Previous message.', id: '00000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb' };
  const generated: ReturnType<typeof compactRequest>[] = [];
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        { key: 'claim:2', kind: 'testimony', fact: '2 claims Percival.', source: 'chat:12345678', certainty: 'claim' },
      ],
    };
  });
  await decide({ ...request, chat: [prefix, original, ...request.chat.slice(1)] });
  await decide({
    ...request,
    chat: [
      { ...original },
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Новое сообщение ${i}.` })),
      ...request.chat.slice(1),
    ],
  });
  expect(generated[1].humanStatements).toContainEqual({ id: '12345678', by: 2, text: human.text });
});

test('colliding public message prefixes expand to distinct source identifiers', () => {
  const first = { ...human, id: '12345678-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
  const second = { name: '2', text: '7 точнее Моргана.', id: '12345678-bbbb-bbbb-bbbb-bbbbbbbbbbbb' };
  const context = compactRequest({
    ...request,
    chat: [
      ...Array.from({ length: 8 }, () => ({ name: '2', text: 'Older chatter.' })),
      first,
      second,
      ...request.chat.slice(1),
    ],
    humanMemory: [[first, second]],
  });
  expect(context.humanStatements).toEqual(
    expect.arrayContaining([
      { id: first.id, by: 2, text: first.text },
      { id: second.id, by: 2, text: second.text },
    ]),
  );
});

test('a fresh correction can be remembered immediately together with its historical original', async () => {
  const original = { name: '2', text: 'Я Персиваль, 7 Мерлин.' };
  const correction = { name: '2', text: '7 точнее Моргана, оговорка.' };
  const initial = [original, ...request.chat.slice(1, 15), correction];
  const generated: ReturnType<typeof compactRequest>[] = [];
  const decide = decisionPipeline(async (_request, options) => {
    generated.push(options.context as ReturnType<typeof compactRequest>);
    return {
      choice: 0,
      speech: 'Private reason.',
      evidence: [
        {
          key: 'claim:2',
          kind: 'testimony',
          fact: '2 corrected Merlin to Morgana.',
          source: 'chat:1;recent:14',
          certainty: 'claim',
        },
      ],
    };
  });
  await decide({ ...request, chat: initial });
  await decide({
    ...request,
    chat: [
      ...initial,
      ...Array.from({ length: 30 }, (_, i) => ({ name: '2', text: `Дальнейшая реплика ${i}.` })),
      ...request.chat.slice(1),
    ],
  });
  expect(generated[1].humanStatements).toEqual(
    expect.arrayContaining([
      { id: 1, by: 2, text: original.text },
      { id: 16, by: 2, text: correction.text },
    ]),
  );
});

test('insufficient byte budget omits an entire old correction group without clipping it', () => {
  const original = { name: '2', text: 'a'.repeat(2000) };
  const correction = { name: '2', text: 'b'.repeat(2000) };
  const chat = [
    ...Array.from({ length: 8 }, () => ({ name: '2', text: ')' })),
    original,
    correction,
    ...Array.from({ length: 30 }, () => ({ name: '2', text: '+' })),
    ...request.chat.slice(1),
  ];
  const context = compactRequest({ ...request, chat, humanMemory: [[original, correction]] });
  expect(context.humanStatements).toHaveLength(16);
  expect(context.humanStatements!.every((m) => m.text === '+')).toBe(true);
});

test('the recent-human fallback cannot retain an original while its remembered correction is over budget', () => {
  const chat = Array.from({ length: 40 }, () => ({ name: '2', text: 'x' }));
  chat[9].text = 'other ' + 'x'.repeat(1990);
  chat[24].text = '5 is Merlin';
  chat[25].text = 'Actually 5 is Morgana ' + 'x'.repeat(1970);
  const context = compactRequest({
    ...request,
    chat: [...chat, ...request.chat.slice(1)],
    humanMemory: [[chat[24], chat[25]], [chat[9]]],
  });
  expect(context.humanStatements!.map((m) => m.text)).toContain(chat[9].text);
  expect(context.humanStatements!.map((m) => m.text)).not.toContain(chat[24].text);
  expect(context.humanStatements!.map((m) => m.text)).not.toContain(chat[25].text);
});

test('overlapping source groups cannot spend all eight slots on an original without its correction', () => {
  const chat = Array.from({ length: 40 }, () => ({ name: '2', text: 'x' }));
  chat[8].text = '5 is Merlin';
  chat[9].text = 'Actually 5 is Morgana';
  const context = compactRequest({
    ...request,
    chat: [...chat, ...request.chat.slice(1)],
    humanMemory: [
      [chat[8], chat[9]],
      [chat[8], ...chat.slice(10, 17)],
    ],
  });
  expect(context.humanStatements!.map((m) => m.text)).not.toContain(chat[8].text);
  expect(context.humanStatements!.map((m) => m.text)).not.toContain(chat[9].text);
});

test('all-bot games and secret mission turns do not add human testimony', () => {
  const allBots = { ...request, humanPlayerID: undefined } as BotRequest;
  expect(compactRequest(allBots)).toMatchObject({ humanStatements: [] });
  expect(compactRequest({ ...request, state: { ...request.state, stage: 'onMission' } })).not.toHaveProperty(
    'humanStatements',
    expect.any(Array),
  );
});
