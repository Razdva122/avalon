import { BotRoom } from './room';
import { AiTechnicalPause } from './client';
import type { Server } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;

test.each([5, 6, 7, 8] as const)(
  'AI launch randomizes the complete %s-seat lobby and preserves seats on resume',
  async (count) => {
    const ownerSeats = new Set<number>();
    const friendSeats = new Set<number>();
    let separated = false;
    for (let attempt = 0; attempt < 32; attempt++) {
      const room = new BotRoom(
        `shuffle-${attempt}`,
        'owner',
        io,
        async () => {
          throw Error('No inference expected');
        },
        undefined,
        0,
        'en',
        count,
      );
      Object.assign(room.ai!, { publicBotGame: true, withFriend: true });
      room.joinAsHuman('owner');
      room.joinGame('friend');
      const roster = [...room.players].sort();
      const act = jest.spyOn(room as unknown as { act: () => Promise<void> }, 'act');
      act.mockRejectedValueOnce(new AiTechnicalPause('Retry'));
      await room.run();
      if (room.data.stage !== 'started') throw Error('Game did not start');
      const seats = [...room.data.manager.game.players].sort((a, b) => a.index - b.index).map((p) => p.userID);
      expect([...seats].sort()).toEqual(roster);
      const lobbySeats = [...room.players];
      expect(room.humanIDs).toEqual(['owner', 'friend']);
      const owner = seats.indexOf('owner');
      const friend = seats.indexOf('friend');
      ownerSeats.add(owner);
      friendSeats.add(friend);
      if (Math.abs(owner - friend) !== 1 && Math.abs(owner - friend) !== count - 1) separated = true;
      act.mockImplementationOnce(async () => {
        room.stop();
      });
      await room.run(true);
      expect(room.players).toEqual(lobbySeats);
      expect([...room.data.manager.game.players].sort((a, b) => a.index - b.index).map((p) => p.userID)).toEqual(seats);
    }
    expect(ownerSeats.size).toBeGreaterThan(1);
    expect(friendSeats.size).toBeGreaterThan(1);
    expect(separated).toBe(true);
  },
);
