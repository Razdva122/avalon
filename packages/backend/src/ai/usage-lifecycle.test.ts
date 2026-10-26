/* eslint-disable @typescript-eslint/no-explicit-any */
import { AiService } from './service';
import * as limits from './codex-limits';
import * as codex from './codex';
import * as pipeline from './pipeline';
import { codexEnvironment } from './codex-instances';
import type { Manager } from '@/main';
import type { AiRepository } from './repository';

const environment = { ...process.env };
afterEach(() => {
  jest.restoreAllMocks();
  process.env = { ...environment };
});

test('parallel first decisions share a persisted fresh snapshot and finish reads the same account before releasing', async () => {
  process.env.AI_CODEX_INSTANCES = JSON.stringify([{ id: 'one', home: '/pool/one' }]);
  const io: any = { to: () => io, except: () => io, emit: () => true };
  const host: any = { io, rooms: {}, dbManager: {}, updateRoomsList: jest.fn() };
  const service = new AiService(host as Manager);
  const events: string[] = [];
  let allowStart!: () => void;
  const gate = new Promise<void>((resolve) => {
    allowStart = resolve;
  });
  const before = { remainingPercent: 80, resetsAt: 1234, checkedAt: 1 };
  const after = { ...before, remainingPercent: 76 };
  const quota = jest.spyOn(limits, 'getCodexWeeklyLimit').mockImplementation(async (fresh) => {
    expect(fresh).toBe(true);
    expect(codexEnvironment().AI_CODEX_HOME).toBe('/pool/one');
    events.push('quota');
    return events.filter((event) => event === 'quota').length === 1 ? before : after;
  });
  const generate = jest.fn(async () => {
    events.push('decision');
    return { choice: 0, speech: '' };
  });
  jest.spyOn(codex, 'codexDecide').mockReturnValue(generate);
  jest
    .spyOn(pipeline, 'decisionPipeline')
    .mockImplementation((decide) => async (request) => decide(request, { instructions: '', context: {} } as any));
  const start = jest.fn(async () => {
    await gate;
    events.push('persisted');
  });
  const finish = jest.fn(async () => {
    events.push('finish');
  });
  service.repository = {
    startGameUsage: start,
    finishGameUsage: finish,
    renewLease: async () => {
      events.push('renew');
    },
    release: async () => {
      events.push('released');
    },
  } as unknown as AiRepository;
  const room = (service as any).createRoom('usage-room', 'owner', 'ru', 5);
  host.rooms[room.roomID] = room;
  const instance = { id: 'one', environment: { AI_CODEX_HOME: '/pool/one' } };
  (service as any).roomInstances.set(room.roomID, instance);
  const state: any = { stage: 'started', roomID: room.roomID, ai: { status: 'running' }, players: [], options: {} };
  jest.spyOn(room, 'calculateRoomState').mockReturnValue(state);
  const decide = () => (service as any).inRoom(room.roomID, () => room.decide({}));
  const one = decide();
  const two = decide();
  await new Promise((resolve) => setImmediate(resolve));
  expect(quota).toHaveBeenCalledTimes(1);
  expect(start).toHaveBeenCalledTimes(1);
  expect(generate).not.toHaveBeenCalled();
  allowStart();
  await Promise.all([one, two]);
  expect(start).toHaveBeenCalledWith(state, 'one', before);
  expect(generate).toHaveBeenCalledTimes(2);
  room.ai.status = 'finished';
  jest.spyOn(room, 'run').mockResolvedValue(undefined);
  (service as any).runRoom(room);
  await new Promise((resolve) => setImmediate(resolve));
  expect(finish).toHaveBeenCalledWith(room.roomID, after);
  expect(events).toEqual(['quota', 'persisted', 'decision', 'decision', 'renew', 'quota', 'finish', 'released']);
});
