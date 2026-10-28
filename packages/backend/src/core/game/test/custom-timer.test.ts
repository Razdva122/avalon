import { GameManager } from '@/core/game-manager';
import type { Server } from '@avalon/types';

const ids = ['alice', 'bob', 'carol', 'dave', 'eve'];
const io = { to: () => io, except: () => io, emit() {} } as unknown as Server;
function fixture(custom = true) {
  return new GameManager(ids, { roles: {}, addons: {}, features: { useCustomTimer: custom } }, io, 'table');
}
beforeEach(() => jest.useFakeTimers({ now: 100000 }));
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('assigned player is public; next restarts the full duration and wraps around the seats', () => {
  const manager = fixture();
  const timer = manager.game.timer;
  timer.startCustomTimer(120);
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'eve' });
  jest.advanceTimersByTime(30000);
  expect(manager.prepareStateForUser('bob').timer).toMatchObject({ playerID: 'eve', endTime: 220000 });
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(manager.prepareStateForUser().timer).toMatchObject({ playerID: 'alice', active: true, endTime: 250000 });
  jest.advanceTimersByTime(90000); // The previous deadline must not stop the new turn.
  expect(timer.getTimerState().active).toBe(true);
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(timer.getTimerState()).toMatchObject({ playerID: 'bob', endTime: 340000 });
});

test('expiry and stop retain the player, next restarts, and unbinding keeps the countdown', () => {
  const manager = fixture();
  const timer = manager.game.timer;
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'bob' });
  timer.startCustomTimer(60);
  jest.advanceTimersByTime(60000);
  expect(timer.getTimerState()).toMatchObject({ playerID: 'bob', active: false });
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(timer.getTimerState()).toMatchObject({ playerID: 'carol', active: true, endTime: 220000 });
  timer.clearTimer();
  expect(timer.getTimerState()).toMatchObject({ playerID: 'carol', active: false });
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: null });
  expect(timer.getTimerState()).toMatchObject({ active: true, endTime: 220000 });
  expect(timer.getTimerState().playerID).toBeUndefined();
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(timer.getTimerState().playerID).toBeUndefined();
});

test('added time extends only the current turn and next uses the configured duration', () => {
  const manager = fixture();
  const timer = manager.game.timer;
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'alice' });
  timer.startCustomTimer(60);
  jest.advanceTimersByTime(20000);
  timer.addCustomTimerTime(60);
  expect(timer.getRemainingTime()).toBe(100000);
  jest.advanceTimersByTime(10000);
  timer.addCustomTimerTime(60);
  expect(timer.getTimerState().endTime).toBe(280000);
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(timer.getTimerState()).toMatchObject({ playerID: 'bob', endTime: 190000 });
});

test('invalid players, stage timers and ended games cannot acquire or advance a manual turn', () => {
  const manager = fixture();
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'spectator' });
  expect(manager.game.timer.getTimerState().playerID).toBeUndefined();
  const stage = fixture(false);
  stage.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'alice' });
  expect(stage.game.timer.getTimerState().playerID).toBeUndefined();
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'alice' });
  manager.game.endGame('rejectedVote');
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(manager.game.timer.getTimerState().active).toBe(false);
});

test('duration changes are public and apply to new turns without resetting the running clock', () => {
  const manager = fixture();
  const timer = manager.game.timer;
  timer.startCustomTimer(60);
  manager.callGameMethods('alice', { method: 'setCustomTimerPlayer', playerID: 'alice' });
  jest.advanceTimersByTime(20000);
  manager.callGameMethods('alice', { method: 'setCustomTimerDuration', durationSeconds: 120 });
  expect(manager.prepareStateForUser('bob').timer).toMatchObject({ durationSeconds: 120, endTime: 160000 });
  manager.callGameMethods('alice', { method: 'nextCustomTimerPlayer' });
  expect(timer.getTimerState()).toMatchObject({ playerID: 'bob', durationSeconds: 120, endTime: 240000 });
  timer.clearTimer();
  expect(timer.getTimerState()).toMatchObject({ durationSeconds: 120, active: false });
});

test.each([0, -1, 1.5, NaN, Infinity, 86401])(
  'invalid custom duration %s cannot change the preset',
  (durationSeconds) => {
    const manager = fixture();
    manager.callGameMethods('alice', { method: 'setCustomTimerDuration', durationSeconds });
    expect(manager.game.timer.getTimerState().durationSeconds).toBe(60);
  },
);

test('starting without a duration uses the latest server preset', () => {
  const manager = fixture();
  manager.callGameMethods('alice', { method: 'setCustomTimerDuration', durationSeconds: 300 });
  manager.callGameMethods('alice', { method: 'startCustomTimer' });
  expect(manager.game.timer.getTimerState()).toMatchObject({ active: true, durationSeconds: 300, endTime: 400000 });
});
