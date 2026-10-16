import { BotRoom } from './room';
import { Room } from '@/room';
import { AiTechnicalPause, type BotRequest } from './client';
import type { Server } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
const thinkingIDs = (room: BotRoom): string[] | undefined => Reflect.get(room.ai!, 'thinkingPlayerIDs');
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

test('votes and mission cards run in pairs while discussion stays sequential', async () => {
  const active = new Map<string, number>();
  const maximum = new Map<string, number>();
  const thinking: string[][] = [];
  const room = new BotRoom(
    'parallel-game',
    'admin',
    io,
    async (request) => {
      const phase = request.publicDiscussion
        ? 'discussion'
        : request.councilDiscussion
          ? 'council'
          : request.state.stage;
      active.set(phase, (active.get(phase) || 0) + 1);
      maximum.set(phase, Math.max(maximum.get(phase) || 0, active.get(phase)!));
      thinking.push([...(thinkingIDs(room) || [])]);
      if (request.state.stage === 'onMission') {
        expect(thinkingIDs(room)).toBeUndefined();
        expect(request.state.players.filter((p) => p.features.isSent).every((p) => p.features.waitForAction)).toBe(
          true,
        );
      }
      await delay(Number(request.name) % 2 ? 5 : 1);
      active.set(phase, active.get(phase)! - 1);
      let choice = request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0;
      if (request.task.startsWith('Choose the final team')) {
        if (room.data.stage !== 'started') throw Error('not started');
        const evilSeats = room.data.manager.game.players
          .filter((p) => p.role.loyalty === 'evil')
          .map((p) => String(p.index));
        choice = request.choices.findIndex((team) => evilSeats.every((seat) => team.split(', ').includes(seat)));
        if (choice < 0) choice = 0;
      }
      return { choice, speech: request.speak ? `Seat ${request.name} conclusion.` : 'PRIVATE_DECISION' };
    },
    undefined,
    0,
    'en',
    5,
  );
  await room.run();
  expect(room.ai?.status).toBe('finished');
  expect(maximum.get('votingForTeam')).toBe(2);
  expect(maximum.get('onMission')).toBe(2);
  expect(maximum.has('end')).toBe(false);
  expect(maximum.get('discussion')).toBe(1);
  expect(maximum.get('council')).toBe(1);
  expect(thinking.some((ids) => ids.length === 2)).toBe(true);
  expect(thinking.every((ids) => ids.length <= 2)).toBe(true);
  const published = room.chat.history.filter((m) => m.message.startsWith('Post-game:'));
  expect(published).toHaveLength(0);
  expect(JSON.stringify(room.chat.history)).not.toContain('PRIVATE_DECISION');
  expect(thinkingIDs(room)).toBeUndefined();
});

function votingRoom(
  decide: (request: BotRequest, signal?: AbortSignal) => Promise<{ choice: number; speech: string }>,
) {
  const room = new BotRoom(
    'parallel-vote-resume',
    'admin',
    io,
    decide,
    async (state) => {
      if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
    },
    0,
    'en',
    5,
  );
  Room.prototype.startGame.call(room);
  if (room.data.stage !== 'started') throw Error('not started');
  const manager = room.data.manager;
  const leader = manager.game.leader.userID;
  for (const player of manager.game.players.slice(0, 2))
    manager.callGameMethods(leader, { method: 'selectPlayer', playerID: player.userID });
  manager.callGameMethods(leader, { method: 'sentSelectedPlayers' });
  room.ai!.status = 'paused';
  room.ai!.canResumeTechnical = true;
  return room;
}

test('a failed pair pauses without applying partial votes and resume retains its completed peer', async () => {
  const requests: string[] = [];
  let failure = true;
  const room = votingRoom(async (request) => {
    requests.push(request.playerID);
    if (requests.length === 1 && failure) {
      await delay(5);
      failure = false;
      throw new AiTechnicalPause('Temporary provider failure');
    }
    await delay(1);
    return { choice: 0, speech: '' };
  });
  await room.run(true);
  expect(room.ai?.status).toBe('paused');
  expect(requests).toHaveLength(2);
  const completedPeer = requests[1];
  if (room.data.stage !== 'started') throw Error('not started');
  expect(room.data.manager.game.vote!.data.votes.every((v) => v.value === 'unvoted')).toBe(true);
  expect(thinkingIDs(room)).toBeUndefined();
  await room.run(true);
  expect(requests.filter((id) => id === completedPeer)).toHaveLength(1);
  expect(requests).toHaveLength(6);
  expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
});

test('Stop cancels both pending requests and clears both thinking indicators', async () => {
  const signals: AbortSignal[] = [];
  const room = votingRoom(async (_request, signal) => {
    if (!signal) throw Error('missing signal');
    signals.push(signal);
    return new Promise((resolve) =>
      signal.addEventListener('abort', () => resolve({ choice: 0, speech: '' }), { once: true }),
    );
  });
  const running = room.run(true);
  await delay(5);
  expect(signals).toHaveLength(2);
  expect(thinkingIDs(room)).toHaveLength(2);
  room.stop();
  await running;
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  expect(thinkingIDs(room)).toBeUndefined();
  expect(room.ai?.status).toBe('stopped');
});

test('a technical error aborts its pending peer before the next pair starts', async () => {
  const signals: AbortSignal[] = [];
  const room = votingRoom(async (_request, signal) => {
    if (!signal) throw Error('missing signal');
    signals.push(signal);
    if (signals.length === 1) {
      await delay(1);
      throw new AiTechnicalPause('Provider failed');
    }
    return new Promise((resolve) =>
      signal.addEventListener('abort', () => resolve({ choice: 0, speech: '' }), { once: true }),
    );
  });
  await room.run(true);
  expect(signals).toHaveLength(2);
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  expect(room.ai?.status).toBe('paused');
  expect(thinkingIDs(room)).toBeUndefined();
});
