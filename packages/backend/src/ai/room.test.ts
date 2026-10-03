import { BotRoom, BOT_PROFILES, botOptions } from './room';
import type { BotRequest } from './client';
import type { Server } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
const reply = (request: BotRequest) => ({ choice: 0, speech: request.speak ? 'I suggest testing this team.' : '' });

test('seven bots complete a real game, including Lady of Lake and assassination, with public discussion', async () => {
  const stages = new Set<string>();
  const languages: (string | undefined)[] = [];
  const missionThinking: (string | undefined)[] = [];
  const room = new BotRoom('test-room', 'admin', io, async (request) => {
    languages.push(request.language);
    stages.add(request.state.stage);
    if (request.state.stage === 'onMission') missionThinking.push(room.ai?.thinkingPlayerID);
    let choice = request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0;
    if (request.task.startsWith('Choose the final team')) {
      if (room.data.stage !== 'started') throw Error('not started');
      // Force a real secret-card model call regardless of the random role assignment.
      const evil = room.data.manager.game.players.find((player) => player.role.loyalty === 'evil')!;
      choice = request.choices.findIndex((team) => team.split(', ').includes(String(evil.index)));
    }
    return { ...reply(request), choice };
  });
  expect(room.players).toHaveLength(7);
  expect(room.options).toEqual(botOptions);
  await room.run();
  expect(languages.every((language) => language === 'en')).toBe(true);
  expect(room.data.stage).toBe('started');
  if (room.data.stage !== 'started') throw Error('not started');
  expect(room.data.manager.game.stage).toBe('end');
  expect(stages.has('checkLoyalty')).toBe(true);
  expect(stages.has('assassinate')).toBe(true);
  expect(missionThinking.length).toBeGreaterThan(0);
  expect(missionThinking.every((id) => id === undefined)).toBe(true);
  expect(room.chat.history.length).toBeGreaterThan(20);
  expect(room.ai?.status).toBe('finished');
  expect(room.ai).not.toHaveProperty('thinkingPlayerID');
});

test.each([
  { count: 5 as const, missions: [2, 3, 2, 3, 3], roles: ['merlin', 'mordred', 'morgana', 'percival', 'servant'] },
  {
    count: 6 as const,
    missions: [2, 3, 4, 3, 4],
    roles: ['merlin', 'mordred', 'morgana', 'percival', 'servant', 'servant'],
  },
  {
    count: 8 as const,
    missions: [3, 4, 4, 5, 5],
    roles: ['merlin', 'minion', 'mordred', 'morgana', 'percival', 'servant', 'servant', 'servant'],
  },
])(
  '$count bots complete a real game with canonical roles and strict-majority votes',
  async ({ count, missions, roles }) => {
    const requests: BotRequest[] = [];
    const votesBeforeDecisions: string[][] = [];
    const evilCount = count === 8 ? 3 : 2;
    const room = new BotRoom(
      `small-room-${count}`,
      'admin',
      io,
      async (request) => {
        requests.push(request);
        let choice = request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0;
        if (request.state.stage === 'votingForTeam') {
          if (room.data.stage !== 'started') throw Error('not started');
          votesBeforeDecisions.push(room.data.manager.game.vote!.data.votes.map((vote) => vote.value));
          const approvals = Math.floor(count / 2) + (request.state.vote === 0 ? 0 : 1);
          choice = Number(request.name) <= approvals ? 0 : 1;
        }
        if (request.task.startsWith('Choose the final team')) {
          if (room.data.stage !== 'started') throw Error('not started');
          const evil = room.data.manager.game.players.find((player) => player.role.loyalty === 'evil')!;
          choice = request.choices.findIndex((team) => team.split(', ').includes(String(evil.index)));
        }
        return { ...reply(request), choice };
      },
      undefined,
      0,
      'en',
      count,
    );
    expect(room.players).toHaveLength(count);
    expect(new Set(room.players).size).toBe(count);
    expect(room.maxCapacity).toBe(count);
    expect(room.calculateRoomState().ai).toMatchObject({ playerCount: count });
    await room.run();
    expect(room.ai?.status).toBe('finished');
    expect(room.ai?.fallbacks).toBe(0);
    if (room.data.stage !== 'started') throw Error('not started');
    const game = room.data.manager.game;
    expect(game.players.map((player) => player.role.role).sort()).toEqual(roles);
    expect(game.settings.players).toEqual({ good: count - evilCount, evil: evilCount });
    expect(game.settings.total).toBe(count);
    expect(game.settings.missions.map((mission) => mission.players)).toEqual(missions);
    expect(game.settings.missions.map((mission) => mission.failsRequired)).toEqual(
      count === 8 ? [1, 1, 1, 2, 1] : [1, 1, 1, 1, 1],
    );
    expect(requests.every((request) => request.state.players.length === count)).toBe(true);
    for (const stage of ['checkLoyalty', 'announceLoyalty'])
      expect(requests.some((request) => request.state.stage === stage)).toBe(count === 8);
    expect(Boolean(room.options.addons.ladyOfLake)).toBe(count === 8);
    const circles = requests.filter((request) => request.publicDiscussion);
    expect(circles).toHaveLength(count * 6);
    for (let start = 0; start < circles.length; start += count) {
      const circle = circles.slice(start, start + count);
      const leader = circle[0].state.players.find((player) => player.features.isLeader)!;
      expect(circle.map((request) => Number(request.name))).toEqual(
        Array.from({ length: count }, (_, offset) => ((leader.index - 1 + offset) % count) + 1),
      );
      expect(new Set(circle.map((request) => request.playerID)).size).toBe(count);
    }
    const voters = requests.filter((request) => request.state.stage === 'votingForTeam');
    expect(voters).toHaveLength(count * 6);
    expect(voters.every((request) => !request.speak)).toBe(true);
    expect(votesBeforeDecisions).toEqual(Array.from({ length: count * 6 }, () => Array(count).fill('unvoted')));
    const history = room.data.manager.prepareStateForUser().history;
    const votes = history.filter((event) => event.type === 'vote');
    expect(votes.map((vote) => vote.result)).toEqual(['reject', 'approve', 'reject', 'approve', 'reject', 'approve']);
    expect(votes.every((vote) => !vote.anonymous && vote.votes.length === count)).toBe(true);
    expect(history.filter((event) => event.type === 'mission')).toHaveLength(3);
    expect(requests.filter((request) => request.privateDiscussion)).toHaveLength(evilCount);
    expect(room.chat.history.filter((message) => message.message.startsWith('Evil council (revealed):'))).toHaveLength(
      evilCount,
    );
    const reviews = requests.filter((request) => request.state.stage === 'end');
    expect(reviews).toHaveLength(count);
    expect(new Set(reviews.map((request) => request.playerID)).size).toBe(count);
    expect(reviews.every((request) => request.rolesKnownBeforeReveal?.length === count)).toBe(true);
    expect(room.chat.history.filter((message) => message.message.startsWith('Post-game:'))).toHaveLength(count);
  },
);

test.each([0, 4, 9, 10, 5.5, '5', null, NaN])(
  'unsupported player count %s is rejected before creating a room',
  (count) => {
    expect(() => Reflect.construct(BotRoom, ['invalid-count', 'admin', io, reply, undefined, 0, 'en', count])).toThrow(
      'Invalid AI player count',
    );
  },
);

test('eight-player public speech normalizes references to Player 8 into seat numbers', async () => {
  const room = new BotRoom(
    'seat-eight',
    'admin',
    io,
    async () => ({ choice: 0, speech: 'Player 8, explain that vote.' }),
    async () => {
      if (room.chat.history.length === 1) room.stop();
    },
    0,
    'en',
    8,
  );
  await room.run();
  expect(room.chat.history.map((message) => message.message)).toEqual(['8, explain that vote.']);
});

test.each(['ru', 'zh-tw'] as const)(
  '%s room uses its saved language for every stage and public announcement',
  async (language) => {
    const requests: BotRequest[] = [];
    const room = new BotRoom(
      `language-${language}`,
      'admin',
      io,
      async (request) => {
        requests.push(request);
        let choice = request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0;
        if (request.task.startsWith('Choose the final team')) {
          if (room.data.stage !== 'started') throw Error('not started');
          const evil = room.data.manager.game.players.find((player) => player.role.loyalty === 'evil')!;
          choice = request.choices.findIndex((team) => team.split(', ').includes(String(evil.index)));
        }
        return { choice, speech: language === 'ru' ? 'Проверим эту команду.' : '我們來驗證這支隊伍。' };
      },
      async () => {},
      0,
      language,
    );
    expect(room.ai?.message).toMatch(language === 'ru' ? /рус/iu : /繁體中文/u);
    await room.run();
    expect(room.ai?.status).toBe('finished');
    expect(room.calculateRoomState().ai).toMatchObject({ language });
    expect(requests.every((request) => request.language === language)).toBe(true);
    for (const stage of ['selectTeam', 'onMission', 'checkLoyalty', 'announceLoyalty', 'assassinate', 'end'])
      expect(requests.some((request) => request.state.stage === stage)).toBe(true);
    expect(room.chat.history.map((message) => message.message).join('\n')).not.toMatch(
      /I propose|I vote|I inspected|I am Good|Post-game:|Evil council \(revealed\)/,
    );
  },
);

test('cancellation discards replies and spectators never enter prompts', async () => {
  const requests: BotRequest[] = [];
  const thinking: (string | undefined)[] = [];
  const room = new BotRoom('privacy', 'admin', io, async (request) => {
    requests.push(request);
    thinking.push(room.ai?.thinkingPlayerID);
    room.stop();
    thinking.push(room.ai?.thinkingPlayerID);
    return reply(request);
  });
  room.addMessage('spectator', 'SPECTATOR_SECRET');
  await room.run();
  expect(requests).toHaveLength(1);
  expect(thinking).toEqual([requests[0].playerID, undefined]);
  expect(JSON.stringify(requests)).not.toContain('SPECTATOR_SECRET');
  expect(room.ai?.status).toBe('stopped');
  expect(room.chat.history.filter((m) => BOT_PROFILES.some((p) => p.id === m.userID))).toHaveLength(0);
});

test('malformed decisions use legal fallback and repeated API failures pause spending', async () => {
  const room = new BotRoom('errors', 'admin', io, async () => {
    throw Error('provider unavailable');
  });
  await room.run();
  expect(room.ai?.status).toBe('paused');
  expect(room.ai?.fallbacks).toBe(3);
  expect(room.ai).not.toHaveProperty('thinkingPlayerID');
});

test('ordinary lobby mutations cannot change bot configuration or add a human', () => {
  const room = new BotRoom('fixed', 'admin', io, async (r) => reply(r));
  expect(() => room.joinGame('human')).toThrow();
  expect(() => room.updateOptions({ roles: {}, addons: {}, features: {} })).toThrow();
  expect(() => room.leaveGame(room.players[0])).toThrow();
  expect(room.players).toHaveLength(7);
});

test('spectator mentions cannot schedule paid reply turns and full public name mapping is supplied', async () => {
  const requests: BotRequest[] = [];
  const room = new BotRoom('spectator-mentions', 'admin', io, async (request) => {
    requests.push(request);
    room.addMessage('spectator', '1 2 3 4 5 6 7');
    if (request.state.stage === 'votingForTeam') room.stop();
    return reply(request);
  });
  await room.run();
  expect(requests.length).toBeGreaterThan(7);
  expect(requests.some((r) => r.task.startsWith('Briefly answer'))).toBe(false);
  const visible = requests[0].state.players as ((typeof requests)[0]['state']['players'][number] & { name: string })[];
  for (const p of visible) expect(p.name).toBe(`${p.index}`);
});

test.each([7, 8] as const)('all %i prompts enforce the initial private role visibility', async (count) => {
  const seen = new Map<string, BotRequest>();
  const room = new BotRoom(
    'roles',
    'admin',
    io,
    async (request) => {
      if (!seen.has(request.playerID)) seen.set(request.playerID, request);
      if (seen.size === count) room.stop();
      return reply(request);
    },
    undefined,
    0,
    'en',
    count,
  );
  await room.run();
  expect(seen.size).toBe(count);
  const roles = new Map([...seen].map(([id, r]) => [id, r.state.players.find((p) => p.id === id)!.role]));
  expect([...roles.values()].filter((role) => role === 'oberon')).toHaveLength(count === 7 ? 1 : 0);
  expect([...roles.values()].filter((role) => ['mordred', 'morgana', 'oberon', 'minion'].includes(role!))).toHaveLength(
    3,
  );
  expect([...roles.values()].filter((role) => role === 'minion')).toHaveLength(count === 8 ? 1 : 0);
  for (const [id, request] of seen) {
    const own = roles.get(id);
    for (const player of request.state.players) {
      const actual = roles.get(player.id);
      let expected = 'unknown';
      if (player.id === id) expected = own!;
      else if (own === 'merlin' && ['minion', 'morgana', 'oberon'].includes(actual!)) expected = 'evil';
      else if (own === 'percival' && ['merlin', 'morgana'].includes(actual!)) expected = 'mysteryWizard';
      else if (['mordred', 'morgana', 'minion'].includes(own!) && ['mordred', 'morgana', 'minion'].includes(actual!))
        expected = 'evil';
      expect(player.role).toBe(expected);
      if (player.id !== id) expect(player.validMissionsResult).toBeUndefined();
    }
  }
});

test.each([0, 1])(
  'Lady announcement %s gets a matching target response and complete post-game reviews',
  async (announcement) => {
    const requests: BotRequest[] = [];
    const room = new BotRoom('debrief', 'admin', io, async (r) => {
      requests.push(r);
      return {
        choice:
          r.state.stage === 'onMission'
            ? r.choices.indexOf('success')
            : r.state.stage === 'announceLoyalty'
              ? announcement
              : 0,
        speech:
          r.state.stage === 'announceLoyalty'
            ? 'I inspected the player and they are Evil.'
            : r.state.stage === 'end'
              ? 'Our side lost because we trusted the wrong team. '.repeat(12)
              : 'Player 1, let us test this team.',
      };
    });
    await room.run();
    expect(room.options.features.displayIndex).toBe(true);
    expect(requests.filter((r) => r.state.stage === 'checkLoyalty').every((r) => r.speak)).toBe(true);
    expect(room.ai?.fallbacks).toBe(0);
    const conclusions = requests.filter((r) => r.state.stage === 'end');
    expect(conclusions).toHaveLength(7);
    expect(conclusions.every((r) => r.rolesKnownBeforeReveal?.length === 7)).toBe(true);
    expect(
      conclusions.every((r) =>
        r.chat.every((m) => !m.text.startsWith('Post-game:') && !m.text.startsWith('Evil council (revealed):')),
      ),
    ).toBe(true);
    expect(new Set(conclusions.map((r) => r.playerID)).size).toBe(7);
    expect(room.chat.history.filter((m) => m.message.startsWith('Post-game:'))).toHaveLength(7);
    expect(room.chat.history.some((m) => m.message.includes('they are Evil'))).toBe(false);
    expect(room.chat.history.some((m) => /I inspected \d and announce: (Good|Evil)\./.test(m.message))).toBe(true);
    if (room.data.stage !== 'started') throw Error('not started');
    const history = room.data.manager.prepareStateForUser().history;
    for (const event of history) {
      if (event.type !== 'announceLoyalty') continue;
      const target: { index: number } = room.data.manager.game.players.find((p) => p.userID === event.targetID)!;
      const message: { id?: string; message: string } | undefined = room.chat.history.find(
        (m) => m.userID === event.announcerID && m.message.startsWith(`I inspected ${target.index} and announce:`),
      );
      const responseIndex = room.chat.history.findIndex((m) => m.id === message?.id) + 1;
      expect(room.chat.history[responseIndex]?.userID).toBe(event.targetID);
      expect(room.chat.history[responseIndex]?.message).toContain('I am Good');
      expect(room.chat.history[responseIndex]?.message).toContain(announcement === 0 ? 'does not prove' : 'is lying');
      expect(message?.message).toBe(
        `I inspected ${target.index} and announce: ${event.announced === 'good' ? 'Good' : 'Evil'}.`,
      );
    }
    const first = requests[0];
    expect(first.name).toMatch(/^\d$/);
    expect(first.choices.every((c) => !/Alice|Ben|Clara|Daniel|Emma|Felix|Grace/.test(c))).toBe(true);
  },
);

test('each proposal gets a leader-first public circle, final selection, then buffered silent votes', async () => {
  const requests: BotRequest[] = [];
  const votesBeforeDecisions: string[][] = [];
  const room = new BotRoom(
    'public-then-vote',
    'admin',
    io,
    async (request) => {
      requests.push(request);
      if (room.data.stage !== 'started') throw Error('not started');
      if (request.state.stage === 'votingForTeam') {
        votesBeforeDecisions.push(room.data.manager.game.vote!.data.votes.map((vote) => vote.value));
        return { choice: request.state.vote === 0 ? 1 : 0, speech: 'SECRET_VOTE_REPLY' };
      }
      if (request.task.startsWith('Choose the final team')) {
        expect(request.chat).toHaveLength(request.state.vote === 0 ? 7 : 15);
        return { choice: request.choices.length - 1, speech: 'This final roster uses the discussion.' };
      }
      expect(request.state.players.every((player) => !player.features.isSelected)).toBe(true);
      return { choice: 0, speech: `PUBLIC_SEAT_${request.name}` };
    },
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
  );
  await room.run();
  const circles = requests.filter((request) => request.publicDiscussion);
  expect(circles.map((request) => request.name)).toEqual([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '1',
  ]);
  expect(circles.every((request) => request.speak && request.state.stage === 'selectTeam')).toBe(true);
  expect(circles.every((request) => request.choices.every((team) => /^\d, \d$/.test(team)))).toBe(true);
  const selections = requests.filter((request) => request.task.startsWith('Choose the final team'));
  expect(selections).toHaveLength(2);
  expect(selections.every((request) => request.speak && request.optionalSpeech)).toBe(true);
  const voters = requests.filter((request) => request.state.stage === 'votingForTeam');
  expect(voters).toHaveLength(14);
  expect(voters.every((request) => !request.speak && request.choices.join(',') === 'approve,reject')).toBe(true);
  expect(votesBeforeDecisions).toEqual(Array.from({ length: 14 }, () => Array(7).fill('unvoted')));
  expect(JSON.stringify(requests)).not.toContain('SECRET_VOTE_REPLY');
  expect(JSON.stringify(room.chat.history)).not.toContain('SECRET_VOTE_REPLY');
  const secondCircle = circles.slice(7);
  expect(
    secondCircle.every((request) =>
      request.state.history.some((event) => event.type === 'vote' && event.result === 'reject'),
    ),
  ).toBe(true);
  if (room.data.stage !== 'started') throw Error('not started');
  const votes = room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote');
  expect(votes).toHaveLength(2);
  const finalTeam = selections[0].choices[selections[0].choices.length - 1].split(', ');
  for (const vote of votes) {
    if (vote.type !== 'vote') throw Error('not a vote');
    const seatLabels = vote.team.map(({ id }) =>
      String(
        room.data.stage === 'started' && room.data.manager.game.players.find((player) => player.userID === id)!.index,
      ),
    );
    expect(seatLabels).toEqual(finalTeam);
  }
});

test('messages are paced ten seconds apart and Stop cancels the pending pause immediately', async () => {
  jest.useFakeTimers();
  try {
    let calls = 0;
    const room = new BotRoom(
      'paced',
      'admin',
      io,
      async (r) => {
        calls++;
        return reply(r);
      },
      async () => {},
      10000,
    );
    const running = room.run();
    await jest.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);
    await jest.advanceTimersByTimeAsync(9999);
    expect(calls).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(calls).toBe(2);
    room.stop();
    await running;
    expect(calls).toBe(2);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

test('the ten-second interval also covers Lady announcements and all seven conclusions', async () => {
  jest.useFakeTimers();
  try {
    const times: number[] = [];
    const room = new BotRoom(
      'all-paced',
      'admin',
      io,
      async (r) => ({
        choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0,
        speech: r.speak ? 'I agree with this team.' : '',
      }),
      async () => {
        while (times.length < room.chat.history.length) times.push(Date.now());
      },
      10000,
    );
    const running = room.run();
    for (let tick = 0; tick < 100 && room.ai?.status === 'running'; tick++) {
      await jest.advanceTimersByTimeAsync(10000);
    }
    await running;
    expect(room.ai?.status).toBe('finished');
    expect(room.chat.history.some((m) => m.message.startsWith('I inspected'))).toBe(true);
    expect(room.chat.history.filter((m) => m.message.startsWith('Post-game:'))).toHaveLength(7);
    expect(times.length).toBeGreaterThan(20);
    expect(times.slice(1).every((time, index) => time - times[index] >= 10000)).toBe(true);
  } finally {
    jest.useRealTimers();
  }
});

test('the leader can submit the final roster without a public announcement', async () => {
  const requests: BotRequest[] = [];
  const room = new BotRoom(
    'silent-selection',
    'admin',
    io,
    async (request: BotRequest) => {
      requests.push(request);
      return { choice: 0, speech: request.publicDiscussion ? 'A public recommendation.' : '' };
    },
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
  );
  await room.run();
  expect(room.chat.history).toHaveLength(7);
  expect(room.chat.history.every((message) => message.message === 'A public recommendation.')).toBe(true);
  expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(1);
  expect(requests.filter((request) => request.state.stage === 'votingForTeam')).toHaveLength(7);
  if (room.data.stage !== 'started') throw Error('not started');
  expect(
    room.data.manager
      .prepareStateForUser()
      .history.some((event) => event.type === 'vote' && event.result === 'approve'),
  ).toBe(true);
});

test('all three evil players privately deliberate with early evidence before the assassin chooses', async () => {
  const council: BotRequest[] = [];
  let final: BotRequest | undefined;
  let first = true;
  const room = new BotRoom('council', 'admin', io, async (r) => {
    if (r.state.stage !== 'end') {
      expect(room.chat.history.some((m) => m.message.includes('SECRET_COUNCIL'))).toBe(false);
    }
    if (r.task.startsWith('Private Evil council')) council.push(r);
    if (r.task.startsWith('Choose the player you believe is Merlin')) final = r;
    const speech = first
      ? 'EARLY_CLUE: I am Merlin.'
      : r.task.startsWith('Private Evil council')
        ? 'SECRET_COUNCIL: compare the early claim.'
        : 'A cautious team.';
    first = false;
    return { choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0, speech };
  });
  await room.run();
  expect(room.ai?.status).toBe('finished');
  expect(council).toHaveLength(3);
  expect(new Set(council.map((r) => r.playerID)).size).toBe(3);
  for (const r of council) {
    expect(['mordred', 'morgana', 'oberon']).toContain(r.state.players.find((p) => p.id === r.playerID)!.role);
    expect(JSON.stringify(r)).toContain('EARLY_CLUE');
  }
  expect(JSON.stringify(final)).toContain('SECRET_COUNCIL');
  expect(room.chat.history.filter((m) => m.message.startsWith('Evil council (revealed):'))).toHaveLength(3);
});

test('Stop during the private council prevents subsequent advice and assassination', async () => {
  let councilCalls = 0;
  let shots = 0;
  const room = new BotRoom('stop-council', 'admin', io, async (r) => {
    if (r.task.startsWith('Private Evil council')) {
      councilCalls++;
      room.stop();
    }
    if (r.task.startsWith('Choose the player you believe is Merlin')) shots++;
    return { choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0, speech: 'A clue.' };
  });
  await room.run();
  expect(councilCalls).toBe(1);
  expect(shots).toBe(0);
  expect(room.ai?.status).toBe('stopped');
  expect(room.chat.history.some((m) => m.message.startsWith('Evil council'))).toBe(false);
});

test.each(['ru', 'zh-tw'] as const)('%s silent vote replies never enter public chat', async (language) => {
  const secret = language === 'ru' ? 'Я голосую против. СЕКРЕТНЫЙ_ГОЛОС' : '我反對這支隊伍。秘密投票';
  const room = new BotRoom(
    `silent-vote-${language}`,
    'admin',
    io,
    async (request) => ({
      choice: 0,
      speech: request.state.stage === 'votingForTeam' ? secret : request.speak ? 'Public discussion.' : '',
    }),
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
    0,
    language,
  );
  await room.run();
  expect(JSON.stringify(room.chat.history)).not.toContain(secret);
  if (room.data.stage !== 'started') throw Error('not started');
  expect(
    room.data.manager
      .prepareStateForUser()
      .history.some((event) => event.type === 'vote' && event.result === 'approve'),
  ).toBe(true);
});

test('all localized after-game messages stay out of prompts and vote-only messages stay out of assassination evidence', async () => {
  const requests: BotRequest[] = [];
  const room = new BotRoom('localized-history', 'admin', io, async (request) => {
    requests.push(request);
    return { ...reply(request), choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0 };
  });
  const votes = ['I vote reject.', 'Я голосую против.', '我投反對票。'];
  for (const text of [
    'Post-game: OLD_REVIEW_EN',
    'Evil council (revealed): OLD_COUNCIL_EN',
    'После игры: OLD_REVIEW_RU',
    'Совет злых (раскрыт): OLD_COUNCIL_RU',
    '賽後回顧：OLD_REVIEW_ZH',
    '邪惡陣營密談（公開）：OLD_COUNCIL_ZH',
    ...votes,
    'PUBLIC_EARLY_CLUE',
  ])
    room.addMessage(room.players[0], text);
  await room.run();
  expect(room.ai?.status).toBe('finished');
  expect(
    requests.every((request) => request.chat.every((message) => !/OLD_REVIEW|OLD_COUNCIL/.test(message.text))),
  ).toBe(true);
  const evidence = requests
    .filter((request) => request.state.stage === 'assassinate')
    .map((request) => request.evilEvidence!);
  expect(evidence.length).toBeGreaterThan(0);
  for (const messages of evidence) {
    expect(
      messages.every((message) => !votes.includes(message.text) && !/OLD_REVIEW|OLD_COUNCIL/.test(message.text)),
    ).toBe(true);
    expect(messages.some((message) => message.text === 'PUBLIC_EARLY_CLUE')).toBe(true);
  }
});

test.each(['budget', 'technical'] as const)(
  '%s resume preserves a partial public circle without duplicate speeches',
  async (kind) => {
    const { AiMatchBudgetPause, AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    let paused = false;
    const room = new BotRoom('resume-circle', 'admin', io, async (request) => {
      requests.push(request);
      if (!paused && requests.length === 4) {
        paused = true;
        throw kind === 'budget' ? new AiMatchBudgetPause('Match budget', 2000) : new AiTechnicalPause('Output limit');
      }
      return {
        ...reply(request),
        choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0,
      };
    });
    await room.run();
    expect(room.ai?.status).toBe('paused');
    expect(room.chat.history).toHaveLength(3);
    const manager = room.data.stage === 'started' && room.data.manager;
    await room.run(kind === 'budget', kind === 'technical');
    expect(room.data.stage === 'started' && room.data.manager).toBe(manager);
    expect(room.ai?.status).toBe('finished');
    const circle = requests.filter((request) => request.publicDiscussion && request.state.mission === 0);
    expect(circle.map((request) => request.name)).toEqual(['1', '2', '3', '4', '4', '5', '6', '7']);
    expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(3);
  },
);

test('budget resume does not repeat Evil council advice or completed post-game reviews', async () => {
  const { AiMatchBudgetPause } = await import('./client');
  const pauses = new Set<string>();
  const room = new BotRoom('resume-end', 'admin', io, async (request) => {
    if (request.privateDiscussion || request.state.stage === 'end') {
      const key = `${request.state.stage}:${request.playerID}`;
      if (!pauses.has(key)) {
        pauses.add(key);
        throw new AiMatchBudgetPause('Match budget', 1000);
      }
    }
    return { ...reply(request), choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0 };
  });
  await room.run();
  for (let attempt = 0; attempt < 12 && room.ai?.canResumeBudget; attempt++) await room.run(true);
  expect(room.ai?.status).toBe('finished');
  expect(room.chat.history.filter((m) => m.message.startsWith('Evil council (revealed):'))).toHaveLength(3);
  expect(room.chat.history.filter((m) => m.message.startsWith('Post-game:'))).toHaveLength(7);
});

test.each(['budget', 'technical'] as const)(
  '%s resume retries final selection without repeating the public circle',
  async (kind) => {
    const { AiMatchBudgetPause, AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    let paused = false;
    const room = new BotRoom(
      'resume-selection',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        if (!paused && request.task.startsWith('Choose the final team')) {
          paused = true;
          throw kind === 'budget' ? new AiMatchBudgetPause('Match budget', 1000) : new AiTechnicalPause('Output limit');
        }
        return reply(request);
      },
      async (state) => {
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );
    await room.run();
    expect(room.ai?.status).toBe('paused');
    expect(room.chat.history).toHaveLength(7);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.game.players.every((player) => !player.features.isSelected)).toBe(true);
    await room.run(kind === 'budget', kind === 'technical');
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(2);
    expect(room.chat.history.filter((message) => message.message.startsWith('I propose'))).toHaveLength(1);
    expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
  },
);

test.each([
  ['budget', 7],
  ['technical', 7],
  ['budget', 5],
  ['technical', 6],
  ['budget', 8],
  ['technical', 8],
] as const)(
  '%s resume in a %i-player room retains collected silent votes without exposing or repeating them',
  async (kind, count) => {
    const { AiMatchBudgetPause, AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    let paused = false;
    let voteRequests = 0;
    const room = new BotRoom(
      'resume-votes',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        if (request.state.stage === 'votingForTeam' && !paused && ++voteRequests === 4) {
          paused = true;
          throw kind === 'budget' ? new AiMatchBudgetPause('Match budget', 1000) : new AiTechnicalPause('Output limit');
        }
        return { choice: 0, speech: request.state.stage === 'votingForTeam' ? 'PRIVATE_VOTE' : 'Discuss the roster.' };
      },
      async (state) => {
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
      0,
      'en',
      count,
    );
    await room.run();
    expect(room.ai?.status).toBe('paused');
    expect(room.chat.history).toHaveLength(count + 1);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.game.stage).toBe('votingForTeam');
    expect(room.data.manager.game.vote!.data.votes.every((vote) => vote.value === 'unvoted')).toBe(true);
    const votersBefore = requests
      .filter((request) => request.state.stage === 'votingForTeam')
      .slice(0, 3)
      .map((request) => request.playerID);
    await room.run(kind === 'budget', kind === 'technical');
    const voters = requests.filter((request) => request.state.stage === 'votingForTeam');
    expect(voters).toHaveLength(count + 1);
    for (const id of votersBefore) expect(voters.filter((request) => request.playerID === id)).toHaveLength(1);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(count);
    expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(1);
    expect(room.chat.history).toHaveLength(count + 1);
    expect(JSON.stringify(room.chat.history)).not.toContain('PRIVATE_VOTE');
    expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
  },
);

test.each(['discussion', 'selection', 'votes'] as const)(
  'technical resume after the %s checkpoint retains the completed decision',
  async (phase) => {
    const { AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    let paused = false;
    const room = new BotRoom(
      'resume-checkpoint',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        return { choice: 0, speech: request.speak ? 'Discuss the roster.' : '' };
      },
      async (state) => {
        const latest = requests[requests.length - 1];
        if (
          !paused &&
          latest &&
          ((phase === 'discussion' && room.chat.history.length === 3) ||
            (phase === 'selection' &&
              latest.task.startsWith('Choose the final team') &&
              room.chat.history.length === 8) ||
            (phase === 'votes' && latest.state.stage === 'votingForTeam'))
        ) {
          paused = true;
          throw new AiTechnicalPause('Checkpoint temporarily unavailable');
        }
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );
    await room.run();
    expect(room.ai?.canResumeTechnical).toBe(true);
    await room.run(false, true);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(1);
    expect(requests.filter((request) => request.state.stage === 'votingForTeam')).toHaveLength(7);
    expect(room.chat.history).toHaveLength(8);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
  },
);

test.each(['discussion', 'selection'] as const)(
  'technical resume retries a failed %s publication before the next decision without regenerating it',
  async (phase) => {
    const { AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    let failedText: string | undefined;
    const room = new BotRoom(
      'resume-publication',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        return {
          choice: request.optionalSpeech ? request.choices.length - 1 : 0,
          speech: request.speak ? `PUBLIC_LINE_${requests.length}` : '',
        };
      },
      async (state) => {
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );
    room.persistChatMessage = async (id, text) => {
      const latest = requests[requests.length - 1];
      if (!failedText && (phase === 'discussion' ? latest.publicDiscussion : latest.optionalSpeech)) {
        failedText = text;
        throw new AiTechnicalPause('Publication temporarily unavailable');
      }
      room.addMessage(id, text);
    };
    await room.run();
    expect(room.ai?.canResumeTechnical).toBe(true);
    expect(room.chat.history).toHaveLength(phase === 'discussion' ? 0 : 7);
    const before = requests.length;
    await room.run(false, true);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.optionalSpeech)).toHaveLength(1);
    expect(requests.filter((request) => request.state.stage === 'votingForTeam')).toHaveLength(7);
    expect(room.chat.history).toHaveLength(8);
    expect(room.chat.history.filter((message) => message.message === failedText)).toHaveLength(1);
    expect(requests[before].chat.some((message) => message.text === failedText)).toBe(true);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
  },
);

test.each(['discussion', 'selection'] as const)(
  'technical resume reuses the publication ID after %s insertion succeeds but history refresh fails',
  async (phase) => {
    const { AiTechnicalPause } = await import('./client');
    const requests: BotRequest[] = [];
    const publications: { text: string; requestID?: string }[] = [];
    let failedText: string | undefined;
    const room = new BotRoom(
      'resume-inserted-publication',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        return { choice: 0, speech: request.speak ? `PUBLIC_LINE_${requests.length}` : '' };
      },
      async (state) => {
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );
    room.persistChatMessage = async (id, text, requestID?: string) => {
      publications.push({ text, requestID });
      room.addMessage(id, text, requestID);
      const latest = requests[requests.length - 1];
      if (!failedText && (phase === 'discussion' ? latest.publicDiscussion : latest.optionalSpeech)) {
        failedText = text;
        throw new AiTechnicalPause('History refresh temporarily unavailable');
      }
    };
    await room.run();
    expect(room.ai?.canResumeTechnical).toBe(true);
    expect(room.chat.history).toHaveLength(phase === 'discussion' ? 1 : 8);
    await room.run(false, true);
    expect(room.chat.history).toHaveLength(8);
    expect(room.chat.history.filter((message) => message.message === failedText)).toHaveLength(1);
    const retried = publications.filter((publication) => publication.text === failedText);
    expect(retried).toHaveLength(2);
    expect(retried[0].requestID).toEqual(expect.any(String));
    expect(retried[0].requestID).not.toBe('');
    expect(retried[1].requestID).toBe(retried[0].requestID);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.optionalSpeech)).toHaveLength(1);
    expect(requests.filter((request) => request.state.stage === 'votingForTeam')).toHaveLength(7);
  },
);

test.each(['discussion', 'selection', 'votes'] as const)(
  'Stop during %s prevents roster submission or remaining decisions',
  async (phase) => {
    const requests: BotRequest[] = [];
    const room = new BotRoom('stop-phase', 'admin', io, async (request) => {
      requests.push(request);
      if (
        (phase === 'discussion' && requests.length === 4) ||
        (phase === 'selection' && request.task.startsWith('Choose the final team')) ||
        (phase === 'votes' && request.state.stage === 'votingForTeam')
      )
        room.stop();
      return reply(request);
    });
    await room.run();
    expect(room.ai?.status).toBe('stopped');
    expect(requests).toHaveLength(phase === 'discussion' ? 4 : phase === 'selection' ? 8 : 9);
    expect(room.chat.history).toHaveLength(phase === 'discussion' ? 3 : phase === 'selection' ? 7 : 8);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.prepareStateForUser().history.some((event) => event.type === 'vote')).toBe(false);
  },
);

test.each([5, 6, 7, 8] as const)(
  '%i bots complete five missions with four rejected circles before each forced fifth roster',
  async (count) => {
    const requests: BotRequest[] = [];
    const room = new BotRoom(
      'worst-case',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        let choice = 0;
        if (request.state.stage === 'votingForTeam') choice = 1;
        if (request.task.startsWith('Choose the final team')) {
          if (room.data.stage !== 'started') throw Error('not started');
          const evil = room.data.manager.game.players
            .filter((player) => player.role.loyalty === 'evil')
            .map((player) => String(player.index));
          const needed = request.state.settings.missions[request.state.mission].players;
          choice = request.choices.findIndex((team) =>
            evil.slice(0, Math.min(needed, 3)).every((seat) => team.split(', ').includes(seat)),
          );
        }
        if (request.state.stage === 'onMission')
          choice = request.choices.indexOf([0, 2].includes(request.state.mission) ? 'fail' : 'success');
        return { ...reply(request), choice };
      },
      undefined,
      0,
      'en',
      count,
    );
    await room.run();
    expect(room.ai?.status).toBe('finished');
    if (count === 7) expect(requests.length).toBeGreaterThan(350);
    expect(requests.length).toBeLessThanOrEqual(count === 8 ? 450 : 400);
    if (count === 8) expect(requests).toHaveLength(418);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(count * 25);
    expect(requests.filter((request) => request.task.startsWith('Choose the final team'))).toHaveLength(25);
    const voters = requests.filter((request) => request.state.stage === 'votingForTeam');
    expect(voters).toHaveLength(count * 20);
    expect(voters.every((request) => request.state.vote < 4)).toBe(true);
    if (room.data.stage !== 'started') throw Error('not started');
    const history = room.data.manager.prepareStateForUser().history;
    expect(history.filter((event) => event.type === 'mission')).toHaveLength(5);
    expect(history.filter((event) => event.type === 'vote' && event.forced)).toHaveLength(5);
  },
);

test('spectators see public-circle roster choices as discussion advice', async () => {
  const room = new BotRoom(
    'discussion-reason',
    'admin',
    io,
    async (request) => ({ ...reply(request), privateReason: 'PRIVATE_DISCUSSION_ADVICE' }),
    async () => {
      if (room.chat.history.length === 1) room.stop();
    },
  );
  await room.run();
  expect(room.spectatorDecisions).toHaveLength(1);
  expect(room.spectatorDecisions[0]).toMatchObject({ stage: 'discussion', reason: 'PRIVATE_DISCUSSION_ADVICE' });
  expect(JSON.stringify(room.calculateRoomState())).not.toContain('PRIVATE_DISCUSSION_ADVICE');
  expect(JSON.stringify(room.chat.history)).not.toContain('PRIVATE_DISCUSSION_ADVICE');
});

test('spectators get only each bot latest short reason without leaking it to chat, broadcasts or prompts', async () => {
  let turn = 0;
  const requests: BotRequest[] = [];
  const room = new BotRoom('private-reasons', 'admin', io, async (request) => {
    requests.push(request);
    return { ...reply(request), privateReason: `PRIVATE-${++turn}` };
  });
  await room.run();
  const decisions = room.spectatorDecisions;
  expect(decisions).toHaveLength(7);
  expect(new Set(decisions.map((d) => d.playerID)).size).toBe(7);
  expect(decisions[0].reason).toBe(`PRIVATE-${turn}`);
  expect(JSON.stringify(room.calculateRoomState())).not.toContain('PRIVATE-');
  expect(JSON.stringify(room.chat.history)).not.toContain('PRIVATE-');
  expect(JSON.stringify(requests)).not.toContain('PRIVATE-');
});
