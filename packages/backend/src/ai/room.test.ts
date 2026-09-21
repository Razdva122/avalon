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

test('numbered bots each write a post-game conclusion and Lady announcements match the chosen action', async () => {
  const requests: BotRequest[] = [];
  const room = new BotRoom('debrief', 'admin', io, async (r) => {
    requests.push(r);
    return {
      choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0,
      speech:
        r.state.stage === 'announceLoyalty'
          ? 'I inspected the player and they are Evil.'
          : r.state.stage === 'end'
            ? 'Our side lost because we trusted the wrong team.'
            : 'Player 1, let us test this team.',
    };
  });
  await room.run();
  expect(room.options.features.displayIndex).toBe(true);
  const conclusions = requests.filter((r) => r.state.stage === 'end');
  expect(conclusions).toHaveLength(7);
  expect(new Set(conclusions.map((r) => r.playerID)).size).toBe(7);
  expect(room.chat.history.filter((m) => m.message.startsWith('Post-game:'))).toHaveLength(7);
  expect(room.chat.history.some((m) => m.message.includes('they are Evil'))).toBe(false);
  expect(room.chat.history.some((m) => /I inspected \d and announce: Good\./.test(m.message))).toBe(true);
  if (room.data.stage !== 'started') throw Error('not started');
  const history = room.data.manager.prepareStateForUser().history;
  for (const event of history) {
    if (event.type !== 'announceLoyalty') continue;
    const target = room.data.manager.game.players.find((p) => p.userID === event.targetID)!;
    const message = room.chat.history.find(
      (m) => m.userID === event.announcerID && m.message.startsWith(`I inspected ${target.index} and announce:`),
    );
    expect(message?.message).toBe(
      `I inspected ${target.index} and announce: ${event.announced === 'good' ? 'Good' : 'Evil'}.`,
    );
  }
  const first = requests[0];
  expect(first.name).toMatch(/^\d$/);
  expect(first.choices.every((c) => !/Alice|Ben|Clara|Daniel|Emma|Felix|Grace/.test(c))).toBe(true);
});

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
