import { GameManager } from '@/core/game-manager';
import { Room } from '@/room';
import type { Server, GameOptions } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => {} } as unknown as Server;
const ids = Array.from({ length: 8 }, (_, index) => String(index + 1));
const options = (): GameOptions => ({ roles: {}, addons: { trapper: true }, features: {} });

test('Manager restores private excluded value for leader; public snapshots never expose it', () => {
  const manager = new GameManager(ids, options(), io, 'trapper-room');
  const game = manager.game;
  const leader = game.leader.userID;
  game.players.slice(0, 4).forEach((p) => game.selectPlayer(leader, p.userID));
  game.sentSelectedPlayers(leader);
  ids.forEach((id) => game.voteForMission(id, 'approve'));
  game.currentMission.data.actions.forEach((a) => game.actionOnMission(a.player.userID, 'success'));
  expect(manager.prepareStateForUser(leader).stage).toBe('discardMissionCard');
  expect(manager.prepareStateForUser(leader).history.some((h) => h.type === 'discardMissionCard')).toBe(false);
  const target = game.currentMission.data.actions[0].player.userID;
  game.selectPlayer(leader, target);
  manager.callGameMethods(leader, { method: 'discardMissionCard' });
  const restored = manager.prepareStateForUser(leader);
  expect(restored.history.find((h) => h.type === 'discardMissionCard')).toMatchObject({
    leaderID: leader,
    targetID: target,
    result: 'success',
  });
  const publicState = manager.prepareStateForUser();
  expect(publicState.history.find((h) => h.type === 'discardMissionCard')).not.toHaveProperty('result');
  const mission = publicState.history.find((h) => h.type === 'mission');
  expect(mission).toMatchObject({ excludedPlayerID: target, fails: 0, result: 'success' });
  if (mission?.type === 'mission') expect(mission.actions.every((a) => !('value' in a))).toBe(true);
});

test('Invalid player count cannot leave the lobby marked started', () => {
  const room = new Room('room', '1', ids.slice(0, 7), io, options());
  expect(() => room.startGame()).toThrow(/8.*10/);
  expect(room.data.stage).toBe('created');
  expect(room.startAt).toBeUndefined();
});

test('Incompatible plot cards cannot overwrite lobby options', () => {
  const room = new Room('room', '1', ids, io, options());
  expect(() => room.updateOptions({ ...options(), addons: { trapper: true, plotCards: true } })).toThrow(/plot/i);
  expect(room.options.addons.plotCards).toBeUndefined();
});
