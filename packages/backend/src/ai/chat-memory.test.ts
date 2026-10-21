import { compactRequest, parseDecisionReply, type BotRequest } from './client';
import { decisionPipeline } from './pipeline';

const input = (count = 32): BotRequest =>
  ({
    playerID: 'bot',
    name: '1',
    style: 'brief',
    language: 'en',
    task: 'Choose',
    speak: false,
    readAllChat: true,
    humanPlayerIDs: ['human'],
    choices: ['approve', 'reject'],
    state: {
      stage: 'votingForTeam',
      mission: 0,
      vote: 0,
      history: [],
      players: [
        { id: 'bot', index: 1, role: 'servant', features: {} },
        { id: 'human', index: 2, role: 'unknown', features: {} },
      ],
    },
    chat: Array.from({ length: count }, (_, i) => ({ id: `message-${i}`, name: '2', text: `statement ${i}` })),
  }) as unknown as BotRequest;

test('reads every unread human message in bounded chronological batches before choosing, without repeating read batches', async () => {
  const phases: string[] = [],
    read: string[] = [];
  const decide = decisionPipeline(async (_r, options) => {
    phases.push(options.phase!);
    if (options.phase === 'memory') {
      const c = options.context as ReturnType<typeof compactRequest> & { modelHypotheses?: unknown[] };
      read.push(...[...(c.humanStatements || []), ...(c.chat || [])].map((m) => m.text));
      expect(c.chat!.length).toBeLessThanOrEqual(14);
      expect(c.modelHypotheses || []).toHaveLength(0);
      expect(JSON.stringify(c)).not.toMatch(/rolesVisibleToYou|completedMissions|result|mission/);
    }
    return { choice: 0, speech: '', evidence: [] };
  });
  await decide(input());
  expect(phases).toEqual(['memory', 'memory', 'decision']);
  expect(new Set(read)).toEqual(new Set(input().chat.map((m) => m.text)));
  phases.length = 0;
  await decide(input());
  expect(phases).toEqual(['decision']);
  phases.length = 0;
  await decide(input(33));
  expect(phases).toEqual(['memory', 'decision']);
});

test('failed memory batches do not advance the cursor and successful earlier batches are not repeated', async () => {
  let fail = true;
  const counts: number[] = [];
  const decide = decisionPipeline(async (r, options) => {
    if (options.phase === 'memory') {
      counts.push(r.chat.length);
      if (r.chat.length === 32 && fail) {
        fail = false;
        throw Error('interrupted');
      }
    }
    return { choice: 0, speech: '', evidence: [] };
  });
  await expect(decide(input())).rejects.toThrow();
  await decide(input());
  expect(counts).toEqual([16, 32, 32]);
});

test('numeric references resolve only visible human rows and do not require recopying previous IDs', () => {
  const r = input(32);
  const raw = (source: unknown) =>
    JSON.stringify({
      choice: 'approve',
      speech: '',
      publicReason: '',
      evidence: [
        {
          key: 't:2:King',
          kind: 'testimony',
          fact: 'Initially trusted King; now suspects King.',
          source,
          certainty: 'claim',
        },
      ],
    });
  const reply = parseDecisionReply(raw([-14]), r.choices, r);
  expect(reply.evidence![0].source).toBe('recent:14');
  expect(() => parseDecisionReply(raw([1]), r.choices, r)).toThrow();
  expect(() => parseDecisionReply(raw([-15]), r.choices, r)).toThrow();
  expect(() => parseDecisionReply(raw(Array(9).fill(-1)), r.choices, r)).toThrow();
  r.chat[r.chat.length - 1].name = '1';
  expect(() => parseDecisionReply(raw([-14]), r.choices, r)).toThrow();
});

test('numeric sources during assassination use only the displayed historical rows, never hidden recent chat', () => {
  const r = input(32);
  r.state.stage = 'assassinate';
  const raw = (source: number[]) =>
    JSON.stringify({
      choice: 'approve',
      speech: '',
      publicReason: '',
      evidence: [{ key: 't:2:King', kind: 'testimony', fact: 'Changed position.', source, certainty: 'claim' }],
    });
  expect(parseDecisionReply(raw([32]), r.choices, r).evidence![0].source).toBe('chat:32');
  expect(() => parseDecisionReply(raw([-14]), r.choices, r)).toThrow();
});

test('numeric sources keep original, reversal and latest quote bound to their author after eviction and rolling IDs', async () => {
  let turn = 0;
  const observed: { humanStatements?: { text: string }[]; modelHypotheses?: { fact: string }[] }[] = [];
  const decide = decisionPipeline(async (r, options) => {
    if (options.phase !== 'memory') {
      observed.push(options.context as (typeof observed)[number]);
      return { choice: 0, speech: '', evidence: [] };
    }
    const facts = [
      '2 about King: trusts.',
      '2 about King: trusted, then suspects.',
      '2 about King: trusted, suspected, now supports.',
    ];
    const evidence =
      turn < 3 ? [{ key: 't:2:King', kind: 'testimony', fact: facts[turn], source: [-14], certainty: 'claim' }] : [];
    turn++;
    return parseDecisionReply(
      JSON.stringify({ choice: 'observe', speech: '', publicReason: '', evidence }),
      r.choices,
      r,
    );
  });
  await decide(input(16));
  await decide(input(32));
  await decide(input(48));
  await decide(input(80));
  expect(observed[3].humanStatements?.map((m) => m.text)).toEqual(
    expect.arrayContaining(['statement 15', 'statement 31', 'statement 47']),
  );
  expect(observed[3].modelHypotheses![0].fact).toContain('trusted, suspected, now supports');
  await decide({ ...input(81), chat: input(81).chat.slice(8) });
  expect(observed[4].humanStatements?.map((m) => m.text)).toEqual(
    expect.arrayContaining(['statement 15', 'statement 31', 'statement 47']),
  );
});

test('numeric-source parse failure keeps earlier successful batch and retries the unread correction', async () => {
  const counts: number[] = [];
  let invalid = true;
  const decide = decisionPipeline(async (r, o) => {
    if (o.phase !== 'memory') return { choice: 0, speech: '', evidence: [] };
    counts.push(r.chat.length);
    const evidence =
      r.chat.length === 32 && invalid
        ? [{ key: 't:2:King', kind: 'testimony', fact: 'Changed.', source: [0], certainty: 'claim' }]
        : [];
    invalid = r.chat.length === 32 ? false : invalid;
    return parseDecisionReply(
      JSON.stringify({ choice: 'observe', speech: '', publicReason: '', evidence }),
      r.choices,
      r,
    );
  });
  await expect(decide(input())).rejects.toThrow();
  await decide(input());
  expect(counts).toEqual([16, 32, 32]);
});

test('source author must match the keyed speaker even when another human is visible', () => {
  const r = input(16);
  r.state.players.push({ id: 'other', index: 3, role: 'unknown', features: {} });
  r.humanPlayerIDs!.push('other');
  r.chat[r.chat.length - 1].name = '3';
  expect(() =>
    parseDecisionReply(
      JSON.stringify({
        choice: 'approve',
        speech: '',
        publicReason: '',
        evidence: [{ key: 't:2:King', kind: 'testimony', fact: 'Changed.', source: [-14], certainty: 'claim' }],
      }),
      r.choices,
      r,
    ),
  ).toThrow();
});

test('ordinary decisions can still record unpinned testimony from bots; memory-only notes cannot', () => {
  const r = input(1);
  const text = JSON.stringify({
    choice: 'approve',
    speech: '',
    publicReason: '',
    evidence: [
      {
        key: 'bot-report',
        kind: 'testimony',
        fact: 'A bot reports its own Success card.',
        source: 'mission1 discussion',
        certainty: 'claim',
      },
    ],
  });
  expect(parseDecisionReply(text, r.choices, r).evidence![0].fact).toContain('Success');
  expect(() => parseDecisionReply(text, r.choices, { ...r, memoryOnly: true })).toThrow();
});

test('long unread statements are all read within legacy byte budget despite older pinned sources', async () => {
  const r = input(48);
  r.chat.forEach((m, i) => {
    m.text = i < 8 ? '+' : `${i}: ${'x'.repeat(1990)}`;
  });
  const seen = new Set<string>();
  const decide = decisionPipeline(async (req, o) => {
    if (o.phase === 'memory') {
      const c = o.context as ReturnType<typeof compactRequest>;
      const recent = new Set(req.chat.slice(-14));
      const legacy = req.chat
        .filter((_, i) => i < 8 || i >= req.chat.length - 16)
        .filter((m) => !recent.has(m))
        .map((m) => ({ by: 2, text: m.text.slice(0, 2000), status: 'claim' }));
      expect(Buffer.byteLength(JSON.stringify(c.humanStatements))).toBeLessThanOrEqual(
        Buffer.byteLength(JSON.stringify(legacy)),
      );
      for (const m of [...(c.chat || []), ...(c.humanStatements || [])]) seen.add(m.text);
      return parseDecisionReply(
        JSON.stringify({
          choice: 'observe',
          speech: '',
          publicReason: '',
          evidence: [
            {
              key: 't:2:King',
              kind: 'testimony',
              fact: '2 about King: preserves its evolving position.',
              source: [-14],
              certainty: 'claim',
            },
          ],
        }),
        req.choices,
        req,
      );
    }
    return { choice: 0, speech: '', evidence: [] };
  });
  await decide(r);
  expect(seen).toEqual(new Set(r.chat.map((m) => m.text)));
});

test('ordinary bot testimony and private deductions cannot enter the human memory reader', async () => {
  let memorySeen = false;
  const decide = decisionPipeline(async (_r, o) => {
    if (o.phase === 'memory') {
      const c = o.context as { modelHypotheses: unknown[] };
      expect(c.modelHypotheses).toEqual([]);
      memorySeen = true;
      return { choice: 0, speech: '', evidence: [] };
    }
    return {
      choice: 0,
      speech: '',
      evidence: [
        {
          key: 'bot-report',
          kind: 'testimony',
          fact: 'A bot reports Success.',
          source: 'discussion',
          certainty: 'claim',
        },
        {
          key: 'private-role',
          kind: 'deduction',
          fact: 'Private observer knowledge.',
          source: 'private',
          certainty: 'claim',
        },
      ],
    };
  });
  await decide(input(0));
  await decide(input(1));
  expect(memorySeen).toBe(true);
});

test('routine action deductions cannot evict nonreconstructible human history', async () => {
  let decisions = 0,
    memoryCalls = 0;
  const seen: { modelHypotheses?: { key: string }[] }[] = [];
  const decide = decisionPipeline(async (r, o) => {
    if (o.phase === 'memory') {
      const evidence =
        memoryCalls++ === 0
          ? [
              {
                key: 't:2:King',
                kind: 'testimony',
                fact: '2 trusted King, then suspected King.',
                source: [-14],
                certainty: 'claim',
              },
            ]
          : [];
      return parseDecisionReply(
        JSON.stringify({ choice: 'observe', speech: '', publicReason: '', evidence }),
        r.choices,
        r,
      );
    }
    seen.push(o.context as (typeof seen)[number]);
    const turn = decisions++;
    return {
      choice: 0,
      speech: '',
      evidence: Array.from({ length: 3 }, (_, i) => ({
        key: `deduction:${turn}:${i}`,
        kind: 'deduction' as const,
        fact: 'Revisable action inference.',
        source: 'current engine state',
        certainty: 'claim' as const,
      })),
    };
  });
  for (let i = 0; i < 6; i++) await decide(input(16));
  expect(seen[5].modelHypotheses).toEqual(expect.arrayContaining([expect.objectContaining({ key: 't:2:King' })]));
  expect(seen[5].modelHypotheses!.length).toBeLessThanOrEqual(12);
});

test.each(['role', 'check', 'vote'])(
  'typed %s reports survive one-off human subjects within twelve notes',
  async (subject) => {
    let batch = 0;
    const frames: { modelHypotheses?: { key: string }[] }[] = [];
    const decide = decisionPipeline(async (r, o) => {
      if (o.phase !== 'memory') {
        frames.push(o.context as (typeof frames)[number]);
        return { choice: 0, speech: '', evidence: [] };
      }
      const n = batch++;
      const evidence =
        n === 0
          ? [{ key: `t:2:${subject}`, kind: 'testimony', fact: 'Claims Percival.', source: [-14], certainty: 'claim' }]
          : Array.from({ length: 3 }, (_, i) => ({
              key: `t:2:subject${n}-${i}`,
              kind: 'testimony',
              fact: 'An isolated preference.',
              source: [-14],
              certainty: 'claim',
            }));
      return parseDecisionReply(
        JSON.stringify({ choice: 'observe', speech: '', publicReason: '', evidence }),
        r.choices,
        r,
      );
    });
    await decide(input(96));
    expect(frames[0].modelHypotheses).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: `t:2:${subject}` })]),
    );
    expect(frames[0].modelHypotheses!.length).toBe(12);
  },
);

test('live unread tracking refuses missing or duplicated message IDs instead of silently rebinding a cursor', async () => {
  let generated = 0;
  const decide = decisionPipeline(async () => {
    generated++;
    return { choice: 0, speech: '', evidence: [] };
  });
  const missing = input(2);
  delete missing.chat[0].id;
  await expect(decide(missing)).rejects.toThrow('stable');
  const duplicated = input(2);
  duplicated.chat[1].id = duplicated.chat[0].id;
  await expect(decide(duplicated)).rejects.toThrow('stable');
  expect(generated).toBe(0);
});

test('memory keeps mixed discussion context and preserves human corrections for later decisions', async () => {
  const r = input(1);
  r.chat = [
    { id: 'bot-before', name: '1', text: 'I played Success.' },
    { id: 'human-original', name: '2', text: 'I trust King.' },
    { id: 'bot-between', name: '1', text: 'Send me with King.' },
    { id: 'human-correction', name: '2', text: 'Now I suspect King.' },
  ];
  const frames: ReturnType<typeof compactRequest>[] = [];
  const decide = decisionPipeline(async (req, o) => {
    if (o.phase !== 'memory') {
      frames.push(o.context as ReturnType<typeof compactRequest>);
      return { choice: 0, speech: '', evidence: [] };
    }
    const context = o.context as ReturnType<typeof compactRequest>;
    expect(context.chat).toEqual([
      { by: '1', text: 'I played Success.' },
      { by: '2', text: 'I trust King.' },
      { by: '1', text: 'Send me with King.' },
      { by: '2', text: 'Now I suspect King.' },
    ]);
    return parseDecisionReply(
      JSON.stringify({
        choice: 'observe',
        speech: '',
        publicReason: '',
        evidence: [
          {
            key: 't:2:King',
            kind: 'testimony',
            fact: 'Trusted King; now suspects King.',
            source: [-2, -4],
            certainty: 'claim',
          },
        ],
      }),
      req.choices,
      req,
    );
  });
  await expect(decide(r)).resolves.toMatchObject({ choice: 0 });
  await decide({
    ...r,
    chat: [
      ...r.chat,
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `later-bot-${i}`,
        name: '1',
        text: 'Continue.',
      })),
    ],
  });
  expect(frames[1].humanStatements).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ by: 2, text: 'I trust King.' }),
      expect.objectContaining({ by: 2, text: 'Now I suspect King.' }),
    ]),
  );
});

test('memory ignores bot-authored notes without losing valid human testimony or accepting false human sources', () => {
  const r = { ...input(1), memoryOnly: true, choices: ['observe'] };
  r.chat.unshift({ id: 'bot-message', name: '1', text: 'I played Success.' });
  const bot = { key: 't:1:role', kind: 'testimony', fact: '1 reports Success.', source: [-1], certainty: 'claim' };
  const human = { key: 't:2:King', kind: 'testimony', fact: '2 changed position.', source: [-2], certainty: 'claim' };
  const raw = (evidence: unknown[]) => JSON.stringify({ choice: 'observe', speech: '', publicReason: '', evidence });
  expect(parseDecisionReply(raw([bot]), r.choices, r).evidence).toEqual([]);
  expect(parseDecisionReply(raw([bot, human]), r.choices, r).evidence).toEqual([{ ...human, source: 'recent:2' }]);
  expect(() => parseDecisionReply(raw([{ ...human, source: [-1] }]), r.choices, r)).toThrow(
    'Testimony reference is not a visible statement by its author',
  );
});
