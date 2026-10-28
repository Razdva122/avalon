import type { VisualGameState } from '@avalon/types';
import type { BotRequest, GenerationOptions } from './client';
import { decisionPipeline } from './pipeline';
import {
  addressedToYou,
  falseVoteClaim,
  speakerContext,
  spokenPass,
  withoutRepeatedEmoji,
  withoutTeamRepeat,
} from './speaker';

const missions = [
  [2, 1],
  [3, 1],
  [3, 1],
  [4, 2],
  [4, 1],
].map(([players, failsRequired]) => ({ players, failsRequired }));

// Seven seats; the observer is seat 2. History events refer to seats by player ID.
function table(options: {
  roles?: Record<number, string>;
  history?: unknown[];
  chat?: [number, string][];
  stage?: string;
  publicDiscussion?: boolean;
  choices?: string[];
  speak?: boolean;
}): BotRequest {
  return {
    playerID: '2',
    name: '2',
    style: 'brief',
    task: 'Discuss',
    speak: options.speak ?? true,
    publicDiscussion: options.publicDiscussion ?? true,
    humanPlayerIDs: ['5'],
    state: {
      stage: options.stage ?? 'selectTeam',
      mission: 1,
      vote: 0,
      players: [1, 2, 3, 4, 5, 6, 7].map((seat) => ({
        id: String(seat),
        index: seat,
        role: options.roles?.[seat] ?? (seat === 2 ? 'servant' : 'unknown'),
        features: { isLeader: seat === 1 },
      })),
      settings: {
        players: { good: 4, evil: 3 },
        roles: { good: ['merlin', 'percival', 'servant', 'servant'], evil: ['mordred', 'morgana', 'oberon'] },
        missions,
      },
      history: options.history ?? [],
    } as unknown as VisualGameState,
    chat: (options.chat || []).map(([seat, text], i) => ({ id: String(i), name: String(seat), text })),
    choices: options.choices ?? ['1, 2, 3', '1, 2, 4'],
  };
}

const withSpeaker = async (run: () => Promise<void>) => {
  process.env.AI_SPEAKER = 'on';
  try {
    await run();
  } finally {
    process.env.AI_SPEAKER = 'off';
  }
};

const generator = (speakerLine: string | Error) =>
  jest.fn(async (_request: BotRequest, options: GenerationOptions) => {
    if (options.phase === 'speech') {
      if (speakerLine instanceof Error) throw speakerLine;
      return { choice: 0, speech: 'note', publicReason: speakerLine };
    }
    return {
      choice: 0,
      speech: 'private',
      publicReason: 'I would keep 1 and 2 and add 3, since the first mission came back clean for that pair.',
    };
  });

test('speaker: the spoken line comes from the speech call once the action is final', () =>
  withSpeaker(async () => {
    const generate = generator('1 and 2 already passed one. Add 3, why not.');
    const reply = await decisionPipeline(generate)(table({}));
    expect(generate.mock.calls.map(([, options]) => options.phase)).toEqual(['decision', 'speech']);
    expect(reply.speech).toBe('1 and 2 already passed one. Add 3, why not.');
    // The speech call sees what a player has in mind, not the decision's private reasoning.
    const context = generate.mock.calls[1][1].context as ReturnType<typeof speakerContext>;
    expect(context.action).toBe('In this discussion you would send 1, 2, 3.');
    expect(JSON.stringify(context)).not.toContain('private');
  }));

test('speaker: a line that leaks a role, states another roster or fails keeps the decision line', () =>
  withSpeaker(async () => {
    const draft = 'I would keep 1 and 2 and add 3, since the first mission came back clean for that pair.';
    for (const line of ['I am Merlin, trust me on 3.', 'I propose 1, 2, 4.', new Error('provider down')]) {
      const reply = await decisionPipeline(generator(line))(table({ publicDiscussion: false }));
      expect(reply.speech).toBe(draft);
    }
  }));

test('speaker: silent turns make no speech call', () =>
  withSpeaker(async () => {
    const generate = generator('unused');
    await decisionPipeline(generate)(
      table({ stage: 'votingForTeam', publicDiscussion: false, speak: false, choices: ['approve', 'reject'] }),
    );
    expect(generate.mock.calls.map(([, options]) => options.phase)).not.toContain('speech');
  }));

test('speaker: questions and accusations naming the seat since its last line are listed for an answer', () => {
  const request = table({
    chat: [
      [3, '2, what do you think?'],
      [2, 'I like 1, 2, 3.'],
      [4, 'Why 3, 2?'],
      [5, 'I trust 2 here.'],
      [7, 'Sending 1, 2 and 6 is fine.'],
      [6, 'Is 4 Evil?'],
    ],
  });
  expect(addressedToYou(request, 2)).toEqual([
    { from: '4', text: 'Why 3, 2?' },
    { from: '5', text: 'I trust 2 here.' },
  ]);
});

test('speaker: a discussion seat may pass unless someone just addressed it', () =>
  withSpeaker(async () => {
    expect((await decisionPipeline(generator(''))(table({}))).speech).toBe('');
    // Called out: the decision's own line stays rather than silence.
    const called = table({ chat: [[4, '2 was on the failed team, why?']] });
    expect((await decisionPipeline(generator(''))(called)).speech).not.toBe('');
  }));

test('speaker: Evil is told to cut loose an ally the table already caught', () => {
  // Seats 3 and 4 played the only two Fails on the 3, 4 opener: the record proves both Evil.
  const request = table({
    roles: { 2: 'morgana', 3: 'mordred' },
    history: [
      {
        type: 'mission',
        index: 0,
        leaderID: '1',
        result: 'fail',
        fails: 2,
        settings: { players: 2, failsRequired: 1 },
        actions: [{ playerID: '3' }, { playerID: '4' }],
      },
    ],
  });
  const context = speakerContext(request, { choice: 0, speech: '' }, {}, 'draft');
  expect(context.plan).toMatchObject({ side: 'evil', cutLoose: [3] });
});

test('speaker: a leader line that opens by naming its own team again drops that opening', () => {
  expect(withoutTeamRepeat('3, 4, 6: 2, 3, 6 was rejected, so 2 stays off.', '3, 4, 6')).toBe(
    '2, 3, 6 was rejected, so 2 stays off.',
  );
  expect(withoutTeamRepeat("I'll go 2, 3, 6. 1, good call.", '2, 3, 6')).toBe('1, good call.');
  expect(withoutTeamRepeat('Sending 1 and 5, the opener stays small.', '1, 5')).toBe('The opener stays small.');
  // Another team, or seats inside the sentence, stay.
  expect(withoutTeamRepeat('1, 4 and 5 just passed one.', '1, 4, 5, 7')).toBe('1, 4 and 5 just passed one.');
});

test('speaker: Evil council lines go through the speaker and may name a Merlin suspect', () =>
  withSpeaker(async () => {
    const request = {
      ...table({
        roles: { 2: 'morgana', 3: 'mordred' },
        stage: 'assassinate',
        publicDiscussion: false,
        choices: ['4', '5'],
      }),
      councilDiscussion: true,
    };
    const generate = generator('4 is Merlin for me, he dodged every failed team early. 5 is the other option.');
    const reply = await decisionPipeline(generate)(request);
    expect(generate.mock.calls.map(([, options]) => options.phase)).toContain('speech');
    expect(reply.speech).toBe('4 is Merlin for me, he dodged every failed team early. 5 is the other option.');
  }));

test('speaker: a seat that just used an emoji publishes the next line without one', () => {
  const request = table({
    chat: [
      [2, 'Sounds good 🙂'],
      [3, 'ok'],
      [2, 'Fine by me 🙂'],
    ],
  });
  expect(withoutRepeatedEmoji(request, 2, 'Feels like a fair middle ground 🙂')).toBe(
    'Feels like a fair middle ground',
  );
  expect(withoutRepeatedEmoji(table({ chat: [[2, 'Sounds good']] }), 2, 'Sure 🙂')).toBe('Sure 🙂');
});

test('speaker: a spoken pass on a discussion turn is published as silence', () =>
  withSpeaker(async () => {
    expect((await decisionPipeline(generator('No new point to add.'))(table({}))).speech).toBe('');
    expect(spokenPass('Pass. Nothing new to add.')).toBe(true);
    expect(spokenPass('Nothing to add, 1 and 3 is fine.')).toBe(false);
  }));

test('speaker: a claim that a seat cast a vote it never cast is caught', () => {
  expect(falseVoteClaim(table({}), '3 and 6 both approved 4 earlier.')).toBe('3 never approved a team');
  const voted = table({
    history: [
      {
        type: 'vote',
        leaderID: '1',
        team: [{ id: '1' }, { id: '2' }],
        result: 'approve',
        forced: false,
        votes: [1, 2, 3, 4, 5, 6, 7].map((seat) => ({
          playerID: String(seat),
          value: seat === 6 ? 'reject' : 'approve',
        })),
      },
    ],
  });
  expect(falseVoteClaim(voted, '3 approved that one, and 6 rejected it.')).toBeUndefined();
  expect(falseVoteClaim(voted, '6 approved it too.')).toBe('6 never approved a team');
  // "Backed" can describe chat, so it is not checked.
  expect(falseVoteClaim(table({}), '3 backed 4 earlier.')).toBeUndefined();
});

test('speaker: a hung speech call gives up and keeps the decision line', () =>
  withSpeaker(async () => {
    process.env.AI_OPTIONAL_TIMEOUT_MS = '50';
    try {
      const generate = jest.fn(async (_request: BotRequest, options: GenerationOptions, signal?: AbortSignal) => {
        if (options.phase !== 'speech') return { choice: 0, speech: 'private', publicReason: 'Keep 1 and 2, add 3.' };
        return new Promise<never>((_, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      });
      expect((await decisionPipeline(generate)(table({}))).speech).toBe('Keep 1 and 2, add 3.');
    } finally {
      delete process.env.AI_OPTIONAL_TIMEOUT_MS;
    }
  }));
