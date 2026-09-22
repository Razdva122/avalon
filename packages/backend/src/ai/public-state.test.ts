import { publicRoomState } from './public-state';
import { BotRoom } from './room';
import type { Server } from '@avalon/types';

test('AI broadcasts and replay serialization hide cost without mutating persistence state', () => {
  const emit = jest.fn();
  const io = { to: () => io, except: () => io, emit } as unknown as Server;
  const room = new BotRoom('room', 'owner', io, async () => ({ choice: 0, speech: '' }));
  room.ai!.costRub = 18.4;
  room.ai!.model = 'qwen-test';
  room.ai!.message = 'Лимит партии 150 ₽: использовано 148.12 ₽, резерв запроса 5.10 ₽.';
  const persisted = room.calculateRoomState();
  expect(publicRoomState(persisted).ai).not.toHaveProperty('costRub');
  expect(publicRoomState(persisted).ai?.model).toBe('qwen-test');
  expect(persisted.ai?.costRub).toBe(18.4);
  expect(publicRoomState(persisted).ai?.message).not.toContain('148.12');
  room.updateRoomState();
  room.updateRoomState(true);
  for (const [event, state] of emit.mock.calls) {
    expect(event).toBe('roomUpdated');
    expect(state.ai).not.toHaveProperty('costRub');
  }
});
