import { BotRoom, BOT_PROFILES, botOptions } from './room';
import type { BotRequest } from './client';
import type { Server } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
const reply = (request: BotRequest) => ({ choice: 0, speech: request.speak ? 'I suggest testing this team.' : '' });

test('seven bots complete a real game, including Lady of Lake and assassination, with public discussion', async () => {
  const stages = new Set<string>();
  const room = new BotRoom('test-room', 'admin', io, async (request) => {
    stages.add(request.state.stage);
    return { ...reply(request), choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0 };
  });
  expect(room.players).toHaveLength(7);
  expect(room.options).toEqual(botOptions);
  await room.run();
  expect(room.data.stage).toBe('started');
  if (room.data.stage !== 'started') throw Error('not started');
  expect(room.data.manager.game.stage).toBe('end');
  expect(stages.has('checkLoyalty')).toBe(true);
  expect(stages.has('assassinate')).toBe(true);
  expect(room.chat.history.length).toBeGreaterThan(20);
  expect(room.ai?.status).toBe('finished');
});

test('cancellation discards replies and spectators never enter prompts', async () => {
  const requests: BotRequest[] = [];
  const room = new BotRoom('privacy', 'admin', io, async (request) => {
    requests.push(request);
    room.stop();
    return reply(request);
  });
  room.addMessage('spectator', 'SPECTATOR_SECRET');
  await room.run();
  expect(requests).toHaveLength(1);
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
    if (request.task.startsWith('Give your final vote')) room.stop();
    return reply(request);
  });
  await room.run();
  expect(requests.length).toBeGreaterThan(7);
  expect(requests.some((r) => r.task.startsWith('Briefly answer'))).toBe(false);
  const visible = requests[0].state.players as ((typeof requests)[0]['state']['players'][number] & { name: string })[];
  for (const p of visible) expect(p.name).toBe(`${p.index}`);
});

test('all seven prompts enforce the initial private role visibility', async () => {
  const seen = new Map<string, BotRequest>();
  const room = new BotRoom('roles', 'admin', io, async (request) => {
    if (!seen.has(request.playerID)) seen.set(request.playerID, request);
    if (seen.size === 7) room.stop();
    return reply(request);
  });
  await room.run();
  expect(seen.size).toBe(7);
  const roles = new Map([...seen].map(([id, r]) => [id, r.state.players.find((p) => p.id === id)!.role]));
  for (const [id, request] of seen) {
    const own = roles.get(id);
    for (const player of request.state.players) {
      const actual = roles.get(player.id);
      let expected = 'unknown';
      if (player.id === id) expected = own!;
      else if (own === 'merlin' && ['minion', 'morgana'].includes(actual!)) expected = 'evil';
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

test('discussion collects votes in the same calls and applies them to the unchanged team', async () => {
  const calls: BotRequest[] = [];
  const room = new BotRoom(
    'combined-votes',
    'admin',
    io,
    async (r) => {
      calls.push(r);
      return { choice: 0, speech: 'I approve this team.' };
    },
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
  );
  await room.run();
  expect(calls.filter((r) => r.task.includes('vote'))).toHaveLength(7);
  expect(calls.some((r) => r.state.stage === 'votingForTeam')).toBe(false);
  const voters = calls.filter((r) => r.task.includes('vote'));
  expect(new Set(voters.map((r) => r.playerID)).size).toBe(7);
  expect(voters.every((r) => r.speak && r.choices.join(',') === 'approve,reject')).toBe(true);
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

test('a conflicting model sentence cannot contradict the announced and recorded vote', async () => {
  const room = new BotRoom(
    'vote-text',
    'admin',
    io,
    async () => ({ choice: 0, speech: 'I reject this team.' }),
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
  );
  await room.run();
  const announcements = room.chat.history.filter((m) => m.message.startsWith('I vote'));
  expect(announcements).toHaveLength(7);
  expect(announcements.every((m) => m.message === 'I vote approve.')).toBe(true);
  if (room.data.stage !== 'started') throw Error('not started');
  const vote = room.data.manager.prepareStateForUser().history.find((e) => e.type === 'vote');
  expect(vote?.type === 'vote' && vote.result).toBe('approve');
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
    expect(['mordred', 'morgana', 'minion']).toContain(r.state.players.find((p) => p.id === r.playerID)!.role);
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

test('vote publication retains historical evidence and removes only a conflicting decision sentence', async () => {
  const room = new BotRoom(
    'vote-reasons',
    'admin',
    io,
    async () => ({
      choice: 0,
      speech: 'I reject this team. 4 rejected the previous safe roster. This team excludes 4.',
    }),
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
  );
  await room.run();
  const votes = room.chat.history.filter((m) => m.message.startsWith('I vote'));
  expect(votes).toHaveLength(7);
  expect(
    votes.every((m) => m.message === 'I vote approve. 4 rejected the previous safe roster. This team excludes 4.'),
  ).toBe(true);
});

test('budget resume retains the proposed team and completed discussion votes', async () => {
  const { AiMatchBudgetPause } = await import('./client');
  const tasks: string[] = [];
  let paused = false;
  const room = new BotRoom('resume', 'admin', io, async (request) => {
    tasks.push(request.task);
    if (!paused && tasks.length === 4) {
      paused = true;
      throw new AiMatchBudgetPause('Match budget', 2000);
    }
    return { ...reply(request), choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0 };
  });
  await room.run();
  expect(room.ai?.canResumeBudget).toBe(true);
  const manager = room.data.stage === 'started' && room.data.manager;
  const before = room.chat.history.length;
  await room.run(true);
  expect(room.data.stage === 'started' && room.data.manager).toBe(manager);
  expect(room.ai?.status).toBe('finished');
  expect(room.ai?.canResumeBudget).toBe(false);
  expect(tasks.filter((task) => task === 'Propose a team and explain your choice')).toHaveLength(3);
  expect(room.chat.history.length).toBeGreaterThan(before);
});

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

test('technical resume retains the proposed team and completed discussion votes', async () => {
  const { AiTechnicalPause } = await import('./client');
  const tasks: string[] = [];
  let paused = false;
  const room = new BotRoom('resume', 'admin', io, async (request) => {
    tasks.push(request.task);
    if (!paused && tasks.length === 4) {
      paused = true;
      throw new AiTechnicalPause('Output limit');
    }
    return { ...reply(request), choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0 };
  });
  await room.run();
  expect(room.ai?.canResumeTechnical).toBe(true);
  const manager = room.data.stage === 'started' && room.data.manager;
  const before = room.chat.history.length;
  await room.run(false, true);
  expect(room.data.stage === 'started' && room.data.manager).toBe(manager);
  expect(room.ai?.status).toBe('finished');
  expect(room.ai?.canResumeTechnical).toBe(false);
  expect(tasks.filter((task) => task === 'Propose a team and explain your choice')).toHaveLength(3);
  expect(room.chat.history.length).toBeGreaterThan(before);
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
