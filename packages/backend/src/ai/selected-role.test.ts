import { Game } from '@/core/game';
import { BotRoom, botOptions } from './room';
import type { Server } from '@avalon/types';
import { validPacket } from '@/security/validation';

const observer = { gameStateChanged() {} };

test.each(['merlin', 'percival', 'mordred', 'morgana', 'oberon', 'servant'] as const)(
  'solo player receives %s before private knowledge is initialized',
  (role) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const game = new Game(['a', 'b', 'c', 'd', 'e', 'f', 'human'], structuredClone(botOptions), observer, undefined, {
        userID: 'human',
        role,
      });
      expect(game.players.find((player) => player.userID === 'human')!.role.role).toBe(role);
      expect(game.players.map((player) => player.role.role).sort()).toEqual(
        ['merlin', 'percival', 'mordred', 'morgana', 'oberon', 'servant', 'servant'].sort(),
      );
      const merlin = game.players.find((player) => player.role.role === 'merlin')!;
      const morgana = game.players.find((player) => player.role.role === 'morgana')!;
      expect(game.visibleRolesState[merlin.userID][morgana.userID]).toBe('evil');
    }
  },
);

test('solo role selection validates the table composition and rejects friend games', () => {
  const packet = (options: object) => validPacket('createHumanAiRoom', [{ beginner: false, ...options }, () => {}]);
  expect(packet({ role: 'merlin' })).toBe(true);
  expect(packet({ role: 'oberon', playerCount: 7 })).toBe(true);
  expect(packet({ role: 'minion', playerCount: 8 })).toBe(true);
  for (const options of [
    { role: 'oberon' },
    { role: 'minion' },
    { role: 'unknown' },
    { role: null },
    { role: 'merlin', withFriend: true },
    { role: 'oberon', playerCount: 8 },
  ]) {
    expect(packet(options)).toBe(false);
  }
});

test('real bot-room launch applies the selected solo role without exposing it in room metadata', async () => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('selected-role', 'human', io, async () => {
    throw Error('No inference expected');
  });
  room.joinAsHuman('human');
  room.setHumanRole('merlin');
  jest.spyOn(room as unknown as { act: () => Promise<void> }, 'act').mockImplementation(async () => {
    room.stop();
  });
  await room.run();
  if (room.data.stage !== 'started') throw Error('Game did not start');
  expect(room.data.manager.game.players.find((player) => player.userID === 'human')!.role.role).toBe('merlin');
  expect(room.calculateRoomState().ai).not.toHaveProperty('role');
  expect(room.calculateRoomState().ai).not.toHaveProperty('selectedHumanRole');
});
