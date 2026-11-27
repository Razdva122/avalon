import { Room } from '@/room';
import { eventBus } from '@/helpers';
import type { Server, GameOptions } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => {} } as unknown as Server;
const options = (): GameOptions => ({ roles: {}, addons: {}, features: {} });
const ids = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));

function startedRoom(n = 5) {
  const room = new Room('room', '1', ids(n), io, options());
  room.startGame();
  return room;
}

afterEach(() => jest.restoreAllMocks());

test('duplicate vote throws and is not counted', () => {
  const room = startedRoom(7);
  room.startVoteFor('endGame');
  room.makeVote('1', true);
  expect(() => room.makeVote('1', true)).toThrow();
  expect(room.vote?.result.yes).toBe(1);
});

test('spectator cannot vote', () => {
  const room = startedRoom(5);
  room.startVoteFor('endGame');
  expect(() => room.makeVote('spectator', true)).toThrow();
  expect(room.vote?.result.yes).toBe(0);
  expect(room.vote?.result.no).toBe(0);
});

describe.each([5, 6, 7, 8, 9, 10])('%i players', (n) => {
  const required = Math.floor(n / 2) + 1;

  test('a vote requires a strict majority of all players', () => {
    const room = startedRoom(n);
    room.startVoteFor('endGame');
    expect(room.vote?.result).toMatchObject({ total: n, required, yes: 0, no: 0 });
  });

  test('game ends exactly when yes reaches required', () => {
    const room = startedRoom(n);
    const game = room.data.stage === 'started' ? room.data.manager.game : undefined!;
    const endSpy = jest.spyOn(game, 'endGame');
    room.startVoteFor('endGame');
    ids(n)
      .slice(0, required - 1)
      .forEach((id) => room.makeVote(id, true));
    expect(endSpy).not.toHaveBeenCalled();
    expect(room.vote).toBeDefined();
    room.makeVote(String(required), true);
    expect(endSpy).toHaveBeenCalledTimes(1);
    expect(room.vote).toBeUndefined();
    expect(() => room.makeVote(String(required + 1), true)).toThrow();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });

  test('vote is cancelled when enough no votes make majority impossible', () => {
    const room = startedRoom(n);
    room.startVoteFor('endGame');
    // Once this many players vote no, the remaining players cannot reach the required majority.
    const noNeeded = n - required + 1;
    ids(n)
      .slice(0, noNeeded - 1)
      .forEach((id) => room.makeVote(id, false));
    expect(room.vote).toBeDefined();
    room.makeVote(String(noNeeded), false);
    expect(room.vote).toBeUndefined();
  });

  test('restart fires only when yes reaches required, and only once', () => {
    const room = startedRoom(n);
    const emit = jest.spyOn(eventBus, 'emit');
    const restartCalls = () => emit.mock.calls.filter(([e]) => e === 'restartRoom').length;
    room.startVoteFor('endAndRestartGame');
    ids(n)
      .slice(0, required - 1)
      .forEach((id) => room.makeVote(id, true));
    expect(restartCalls()).toBe(0);
    room.makeVote(String(required), true);
    expect(restartCalls()).toBe(1);
    // The vote closed at the majority, so a late vote must not trigger a second restart.
    expect(() => room.makeVote(String(required + 1), true)).toThrow();
    expect(restartCalls()).toBe(1);
  });
});

test('cannot start second vote or vote after game ended', () => {
  const room = startedRoom(5);
  room.startVoteFor('endGame');
  expect(() => room.startVoteFor('endAndRestartGame')).toThrow();
  ['1', '2', '3'].forEach((id) => room.makeVote(id, true));
  expect(() => room.startVoteFor('endGame')).toThrow();
});
