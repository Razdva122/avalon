import { AiPause, compactRequest, type BotRequest } from './client';
import { decisionPipeline, publicContext } from './pipeline';
import { AiService } from './service';
import { BotRoom } from './room';
import { Room } from '@/room';
import type { Manager } from '@/main';
import type { Server } from '@avalon/types';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;

test('live AI requests map current seats to public bot names and human nicknames', async () => {
  const host = {
    io,
    dbManager: { getUserByID: async () => ({ name: 'Дракон', email: 'private@example.com' }) },
  } as unknown as Manager;
  const service = new AiService(host);
  const room = (
    service as unknown as {
      createRoom: (id: string, owner: string, language: 'ru', count: 5) => BotRoom;
    }
  ).createRoom('nicknames', 'owner', 'ru', 5);
  room.joinAsHuman('owner');
  Room.prototype.startGame.call(room);
  if (room.data.stage !== 'started') throw Error('Not started');
  const human = room.data.manager.game.players.find((p) => p.userID === 'owner')!;
  room.data.manager.game.players.filter((p) => p !== human).forEach((p, i) => (p.index = i + 1));
  human.index = 5;
  const bot = room.data.manager.game.players.find((p) => p.userID !== 'owner')!;
  room.data.manager.game.leader = bot;
  room.data.manager.initRoomState();
  let input: BotRequest | undefined;
  Object.assign(room, {
    checkpoint: async () => {},
    decide: async (request: BotRequest) => {
      input = request;
      throw new AiPause('Captured');
    },
  });
  room.addMessage('owner', 'Дракону можно доверять');
  room.ai!.status = 'paused';
  room.ai!.canResumeTechnical = true;
  await room.run(true);
  expect(input).toBeDefined();
  const c = compactRequest(input!);
  expect(c).toHaveProperty(
    'playerNames',
    expect.arrayContaining([
      { seat: 5, name: 'Дракон' },
      { seat: bot.index, name: expect.stringMatching(/ · AI$/) },
    ]),
  );
  expect(JSON.stringify(c)).not.toContain('private@example.com');
  expect(input!.chat).toContainEqual(expect.objectContaining({ name: '5', text: 'Дракону можно доверять' }));
});

test('nickname mapping reaches human memory, decisions and public context without internal IDs', async () => {
  const request = {
    playerID: 'bot',
    name: '1',
    style: 'brief',
    task: 'Vote',
    speak: false,
    readAllChat: true,
    humanPlayerIDs: ['human'],
    choices: ['approve', 'reject'],
    playerNames: [
      { seat: 1, name: 'Дракон' },
      { seat: 2, name: 'Дракон' },
    ],
    state: {
      stage: 'votingForTeam',
      mission: 0,
      vote: 0,
      history: [],
      players: [
        { id: 'bot', index: 1, role: 'servant', features: {} },
        { id: 'human', index: 2, role: 'unknown', features: {} },
      ],
    },
    chat: [{ id: 'm1', name: '2', text: 'Дракону не доверяю' }],
  } as unknown as BotRequest;
  const phases: string[] = [];
  const contexts: unknown[] = [];
  const decide = decisionPipeline(async (_r, options) => {
    phases.push(options.phase!);
    contexts.push(options.context);
    return { choice: 0, speech: '', evidence: [] };
  });
  await decide(request);
  expect(phases).toEqual(['memory', 'decision']);
  for (const context of contexts) {
    expect(context).toHaveProperty('playerNames', [
      { seat: 1, name: 'Дракон' },
      { seat: 2, name: 'Дракон' },
    ]);
    expect(JSON.stringify(context)).not.toContain('"human"');
  }
  expect(publicContext(request, 'approve')).toHaveProperty('playerNames', [
    { seat: 1, name: 'Дракон' },
    { seat: 2, name: 'Дракон' },
  ]);
});
