/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Server, ServerSocket, TRoomState } from '@avalon/types';
import type { Manager } from '@/main';
import { AiPause, AiTechnicalPause, type BotReply } from './client';
import type { AiRepository } from './repository';
import { BotRoom } from './room';
import { AiService } from './service';

const environment = { ...process.env };
const rooms: BotRoom[] = [];
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['setImmediate'] });
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
});

afterEach(async () => {
  for (const room of rooms.splice(0)) room.stop();
  await settle();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  process.env = { ...environment };
});

async function pausedRoom(pause: AiPause = new AiTechnicalPause('Output limit reached')) {
  const saved: TRoomState[] = [];
  const released: string[] = [];
  let failStoppedSave = false;
  let waitForClaim: Promise<void> | undefined;
  let modelCalls = 0;
  let pauseAgain: ((reason: AiPause) => void) | undefined;
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const repository = {
    claim: async () => {
      const pending = waitForClaim;
      waitForClaim = undefined;
      await pending;
    },
    save: async (state: TRoomState) => {
      saved.push(structuredClone(state));
      if (failStoppedSave && state.ai?.status === 'stopped') throw Error('Database unavailable');
    },
    release: async (id: string) => {
      released.push(id);
    },
  };
  const room = new BotRoom(
    'pause-timeout',
    'owner',
    io,
    async (_request, signal) => {
      if (++modelCalls === 1) throw pause;
      return new Promise<BotReply>((resolve, reject) => {
        pauseAgain = reject;
        signal!.addEventListener('abort', () => resolve({ choice: 0, speech: '' }), { once: true });
      });
    },
    repository.save,
    0,
    'ru',
  );
  rooms.push(room);
  room.ai!.model = 'codex-chatgpt';
  room.ai!.codex = { model: 'gpt-6-luna', reasoning: 'low' };
  const host = {
    rooms: { [room.roomID]: room },
    io,
    updateRoomsList: jest.fn(),
    dbManager: { getUserByID: async () => ({ isAdmin: true }) },
  } as unknown as Manager;
  const service = new AiService(host);
  service.repository = repository as unknown as AiRepository;
  const experimentFinalized = jest.fn(async () => {});
  (service as any).experimentRuns.set(room.roomID, experimentFinalized);
  const handlers: Record<string, (...args: any[]) => Promise<void>> = {};
  service.register(
    {
      on: (name: string, handler: any) => {
        handlers[name] = handler;
      },
    } as unknown as ServerSocket,
    'owner',
  );
  const control = async (action: 'start' | 'resumeTechnical' | 'stop') => {
    const response = jest.fn();
    await handlers.controlAiRoom(room.roomID, action, response);
    expect(response).toHaveBeenCalledTimes(1);
    return response.mock.calls[0][0];
  };
  const create = async () => {
    const response = jest.fn();
    await handlers.createAiRoom({ model: 'codex-chatgpt', language: 'ru' }, response);
    expect(response).toHaveBeenCalledTimes(1);
    const result = response.mock.calls[0][0];
    if (result.roomID && host.rooms[result.roomID] !== room) rooms.push(host.rooms[result.roomID] as BotRoom);
    return result;
  };
  expect(await control('start')).toEqual({ ok: true });
  await settle();
  expect(room.ai?.status).toBe('paused');
  expect(modelCalls).toBe(1);
  return {
    room,
    experimentFinalized,
    host,
    saved,
    released,
    control,
    create,
    modelCalls: () => modelCalls,
    pauseAgain: async () => {
      expect(pauseAgain).toBeDefined();
      pauseAgain!(new AiTechnicalPause('Another output limit'));
      await settle();
      expect(room.ai?.status).toBe('paused');
    },
    failStoppedSave: () => {
      failStoppedSave = true;
    },
    delayNextClaim: () => {
      let complete!: () => void;
      waitForClaim = new Promise<void>((resolve) => {
        complete = resolve;
      });
      return complete;
    },
  };
}

test.each([
  ['technical', new AiTechnicalPause('Output limit reached')],
  ['nonrecoverable', new AiPause('Invalid model configuration')],
])('a %s pause stops at fifteen minutes, saves a manual result and frees the room slot', async (_kind, pause) => {
  const fixture = await pausedRoom(pause);
  await jest.advanceTimersByTimeAsync(899999);
  expect(fixture.room.ai?.status).toBe('paused');
  const releasesBeforeExpiry = fixture.released.length;
  fixture.experimentFinalized.mockClear();
  fixture.host.updateRoomsList = jest.fn();

  await jest.advanceTimersByTimeAsync(1);

  expect(fixture.room.ai).toMatchObject({ status: 'stopped', canResumeTechnical: false });
  expect(fixture.room.ai?.message).toMatch(/15/);
  expect(fixture.room.ai?.message).toMatch(/пауз/i);
  expect(fixture.saved.at(-1)).toMatchObject({
    ai: { status: 'stopped' },
    game: { stage: 'end', result: { reason: 'manualy' } },
  });
  expect(fixture.released.slice(releasesBeforeExpiry)).toContain(fixture.room.roomID);
  expect(fixture.experimentFinalized).toHaveBeenCalledTimes(1);
  expect(fixture.host.updateRoomsList).toHaveBeenCalledWith(fixture.room);
  const replacement = await fixture.create();
  expect(replacement).toHaveProperty('roomID');
  expect(replacement.roomID).not.toBe(fixture.room.roomID);
  expect(fixture.modelCalls()).toBe(1);
  expect(jest.getTimerCount()).toBe(0);
});

test('successful technical resume cancels its deadline and a later pause gets a fresh fifteen minutes', async () => {
  const fixture = await pausedRoom();
  await jest.advanceTimersByTimeAsync(600000);
  expect(await fixture.control('resumeTechnical')).toEqual({ ok: true });
  await settle();
  expect(fixture.room.ai?.status).toBe('running');
  expect(jest.getTimerCount()).toBe(0);
  await jest.advanceTimersByTimeAsync(300000);
  expect(fixture.room.ai?.status).toBe('running');

  await fixture.pauseAgain();
  await jest.advanceTimersByTimeAsync(899999);
  expect(fixture.room.ai?.status).toBe('paused');
  await jest.advanceTimersByTimeAsync(1);
  expect(fixture.room.ai?.status).toBe('stopped');
  expect(fixture.modelCalls()).toBe(2);
});

test('manual stop removes the pause timer without later saves or lobby updates', async () => {
  const fixture = await pausedRoom();
  expect(jest.getTimerCount()).toBe(1);
  expect(await fixture.control('stop')).toEqual({ ok: true });
  expect(jest.getTimerCount()).toBe(0);
  const savesAfterStop = fixture.saved.length;
  const releasesAfterStop = fixture.released.length;
  fixture.host.updateRoomsList = jest.fn();

  await jest.advanceTimersByTimeAsync(900000);

  expect(fixture.room.ai?.status).toBe('stopped');
  expect(fixture.saved).toHaveLength(savesAfterStop);
  expect(fixture.released).toHaveLength(releasesAfterStop);
  expect(fixture.host.updateRoomsList).not.toHaveBeenCalled();
});

test('an expiry save failure still releases capacity, publishes the stop and removes the timer', async () => {
  const fixture = await pausedRoom();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  fixture.failStoppedSave();
  const releasesBeforeExpiry = fixture.released.length;
  fixture.experimentFinalized.mockClear();
  fixture.host.updateRoomsList = jest.fn();

  await jest.advanceTimersByTimeAsync(900000);

  expect(fixture.room.ai?.status).toBe('stopped');
  expect(fixture.released.slice(releasesBeforeExpiry)).toContain(fixture.room.roomID);
  expect(fixture.experimentFinalized).toHaveBeenCalledTimes(1);
  expect(fixture.host.updateRoomsList).toHaveBeenCalledWith(fixture.room);
  expect(jest.getTimerCount()).toBe(0);
  const savesAfterExpiry = fixture.saved.length;
  await jest.advanceTimersByTimeAsync(900000);
  expect(fixture.saved).toHaveLength(savesAfterExpiry);
  const replacement = await fixture.create();
  expect(replacement).toHaveProperty('roomID');
  expect(replacement.roomID).not.toBe(fixture.room.roomID);
});

test('expiry frees capacity during a delayed resume claim and rejects and releases that late claim', async () => {
  const fixture = await pausedRoom();
  await jest.advanceTimersByTimeAsync(899000);
  const finishClaim = fixture.delayNextClaim();
  const resuming = fixture.control('resumeTechnical');
  await settle();
  let response: any;
  try {
    await jest.advanceTimersByTimeAsync(1000);
    expect(fixture.room.ai?.status).toBe('stopped');
    const replacement = await fixture.create();
    expect(replacement).toHaveProperty('roomID');
    expect(replacement.roomID).not.toBe(fixture.room.roomID);
    const releasesBeforeLateClaim = fixture.released.length;

    finishClaim();
    response = await resuming;
    await settle();

    expect(response).toHaveProperty('error');
    expect(fixture.released.slice(releasesBeforeLateClaim)).toContain(fixture.room.roomID);
    expect(fixture.modelCalls()).toBe(1);
    expect(fixture.room.ai?.status).toBe('stopped');
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    finishClaim();
    await resuming;
    await settle();
  }
});
