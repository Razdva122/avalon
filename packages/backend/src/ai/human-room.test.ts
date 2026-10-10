import { BotRoom } from './room';
import { AiService } from './service';
import type { AiRepository } from './repository';
import { Room } from '@/room';
import type { Manager } from '@/main';
import type { AiLanguage, Server, ServerSocket, TRoomState } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;

function fixture(kind: 'discussion' | 'vote', language: AiLanguage = 'en') {
  const saved: TRoomState[] = [];
  const requests: string[] = [];
  const room = new BotRoom(
    'human-action-deadline',
    'owner',
    io,
    async (request) => {
      requests.push(request.playerID);
      return { choice: 0, speech: request.speak ? 'A public recommendation.' : '' };
    },
    async (state) => {
      saved.push(structuredClone(state));
    },
    0,
    language,
    5,
  );
  room.joinAsHuman('owner');
  const ai = room.ai!;
  ai.publicBotGame = true;
  Room.prototype.startGame.call(room);
  if (room.data.stage !== 'started') throw Error('not started');
  const game = room.data.manager.game;
  game.leader = game.players.find((player) => player.userID === 'owner')!;
  if (kind === 'vote') {
    for (const player of game.players.slice(0, 2))
      room.data.manager.callGameMethods('owner', { method: 'selectPlayer', playerID: player.userID });
    room.data.manager.callGameMethods('owner', { method: 'sentSelectedPlayers' });
    for (const player of game.players.filter((player) => player.userID !== 'owner'))
      room.data.manager.callGameMethods(player.userID, { method: 'voteForMission', option: 'reject' });
  }
  ai.status = 'paused';
  ai.canResumeTechnical = true;
  return { room, ai, game, saved, requests };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000000);
});
afterEach(() => jest.useRealTimers());

test.each([
  ['vote', 'en', 'Match stopped: the human player did not act within 90 seconds.'],
  ['discussion', 'ru', 'Партия завершена: человек не сделал ход за 90 секунд.'],
  ['discussion', 'zh-tw', '對局已結束：真人玩家未在 90 秒內行動。'],
] as const)('%s stops the public match after 90 seconds (%s)', async (kind, language, message) => {
  const { room, ai, game, saved, requests } = fixture(kind, language);
  const run = room.run(true);
  try {
    await jest.advanceTimersByTimeAsync(0);
    expect(ai).toMatchObject({ waitingForHuman: true, humanActionExpiresAt: 1090000 });
    expect(ai.waitingForDiscussion).toBe(kind === 'discussion' ? true : undefined);
    await jest.advanceTimersByTimeAsync(89999);
    expect(ai.status).toBe('running');
    room.updateRoomState(true);
    room.addMessage('spectator', 'An unrelated message.');
    expect(() => room.humanAction('spectator', { method: 'voteForMission', option: 'approve' })).toThrow();
    expect(ai.humanActionExpiresAt).toBe(1090000);
    await jest.advanceTimersByTimeAsync(1);
    await run;
    expect(ai).toMatchObject({ status: 'stopped', canResumeTechnical: false, message });
    expect(ai.waitingForHuman).toBeUndefined();
    expect(ai.waitingForDiscussion).toBeUndefined();
    expect(ai.humanActionExpiresAt).toBeUndefined();
    expect(ai.discussionPending).toBeUndefined();
    expect(game.stage).toBe('end');
    expect(game.result?.reason).toBe('manualy');
    expect(saved[saved.length - 1].ai).toMatchObject({ status: 'stopped', message });
    expect(saved[saved.length - 1].ai).not.toHaveProperty('humanActionExpiresAt');
    expect(requests).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    room.stop();
    await run;
  }
});

test('passing before expiry cancels that deadline and starts a new deadline only for the next action', async () => {
  const { room, ai, game } = fixture('discussion');
  const run = room.run(true);
  try {
    await jest.advanceTimersByTimeAsync(0);
    expect(ai.humanActionExpiresAt).toBe(1090000);
    await jest.advanceTimersByTimeAsync(89999);
    room.finishDiscussion('owner');
    expect(ai.humanActionExpiresAt).toBeUndefined();
    await jest.advanceTimersByTimeAsync(0);
    expect(ai.waitingForDiscussion).toBeUndefined();
    expect(ai.waitingForHuman).toBe(true);
    expect(ai.humanActionExpiresAt).toBe(1179999);
    await jest.advanceTimersByTimeAsync(1);
    expect(ai.status).toBe('running');
    room.humanAction('owner', { method: 'selectPlayer', playerID: game.players[0].userID });
    room.addMessage('owner', 'This is not a discussion turn.');
    expect(ai.humanActionExpiresAt).toBe(1179999);
    await jest.advanceTimersByTimeAsync(89998);
    room.humanAction('owner', { method: 'selectPlayer', playerID: game.players[1].userID });
    room.humanAction('owner', { method: 'sentSelectedPlayers' });
    await jest.advanceTimersByTimeAsync(0);
    expect(game.stage).toBe('votingForTeam');
    expect(ai.humanActionExpiresAt).toBe(1269998);
    await jest.advanceTimersByTimeAsync(1);
    expect(ai.status).toBe('running');
  } finally {
    room.stop();
    await run;
  }
});

test('a completed human vote cancels its deadline while the next bot action is pending', async () => {
  const { room, ai, game } = fixture('vote');
  let finishBot!: () => void;
  room.persistChatMessage = () => new Promise<void>((resolve) => (finishBot = resolve));
  const run = room.run(true);
  try {
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(89999);
    room.humanAction('owner', { method: 'voteForMission', option: 'reject' });
    await jest.advanceTimersByTimeAsync(0);
    expect(game.stage).toBe('selectTeam');
    expect(ai.waitingForHuman).toBeUndefined();
    expect(ai.humanActionExpiresAt).toBeUndefined();
    await jest.advanceTimersByTimeAsync(90001);
    expect(ai.status).toBe('running');
  } finally {
    room.stop();
    finishBot?.();
    await run;
  }
});

test('admin human rooms keep unlimited waits and publish no action deadline', async () => {
  const { room, ai } = fixture('discussion');
  delete ai.publicBotGame;
  const run = room.run(true);
  try {
    await jest.advanceTimersByTimeAsync(180000);
    expect(ai).toMatchObject({ status: 'running', waitingForHuman: true, waitingForDiscussion: true });
    expect(ai.humanActionExpiresAt).toBeUndefined();
  } finally {
    room.stop();
    await run;
  }
});

test('an action received after its published deadline cannot beat the timer callback', async () => {
  const { room, ai, game } = fixture('vote');
  const run = room.run(true);
  try {
    await jest.advanceTimersByTimeAsync(0);
    jest.setSystemTime(1090000);
    expect(() => room.humanAction('owner', { method: 'voteForMission', option: 'approve' })).toThrow();
    await run;
    expect(ai.status).toBe('stopped');
    expect(game.stage).toBe('end');
  } finally {
    room.stop();
    await run;
  }
});

test('the service releases the shared room lease after a human action timeout', async () => {
  const oldEnvironment = { ...process.env };
  process.env.NODE_ENV = 'development';
  process.env.AI_CODEX_ENABLED = 'true';
  const { room, ai } = fixture('vote');
  const released: string[] = [];
  const service = new AiService({
    rooms: { [room.roomID]: room },
    io,
    updateRoomsList() {},
    dbManager: { getUserByID: async () => ({ isAdmin: false }) },
  } as unknown as Manager);
  service.repository = {
    claim: async () => {},
    release: async (id: string) => {
      released.push(id);
    },
  } as unknown as AiRepository;
  let control!: (id: string, action: string, callback: (result: unknown) => void) => Promise<void>;
  service.register(
    {
      on: (event: string, handler: typeof control) => {
        if (event === 'controlAiRoom') control = handler;
      },
    } as unknown as ServerSocket,
    'owner',
  );
  try {
    const response = jest.fn();
    await control(room.roomID, 'resumeTechnical', response);
    expect(response).toHaveBeenCalledWith({ ok: true });
    await jest.advanceTimersByTimeAsync(89999);
    expect(released).toEqual([]);
    await jest.advanceTimersByTimeAsync(1);
    expect(ai.status).toBe('stopped');
    expect(released).toEqual([room.roomID]);
  } finally {
    room.stop();
    await jest.advanceTimersByTimeAsync(0);
    process.env = oldEnvironment;
  }
});

test('prestart language changes apply to both the ready message and actual bot requests', async () => {
  const languages: AiLanguage[] = [];
  const room = new BotRoom('ready-language', 'owner', io, async (request) => {
    languages.push(request.language || 'en');
    room.stop();
    return { choice: 0, speech: '' };
  });
  room.setLanguage('ru');
  expect(room.ai).toMatchObject({ language: 'ru', message: 'AI-игроки готовы · Обсуждение на русском' });
  await room.run();
  expect(languages).toEqual(['ru']);
  expect(() => room.setLanguage('en')).toThrow();
  expect(room.ai?.language).toBe('ru');
});
