import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Room } from '@/room';
import { eventBus } from '@/helpers';
import { DBManager } from '@/db';
import { roomModel, playerTrueSkillRatingModel, gameTrueSkillResultModel } from '@/db/models';
import { updateTrueSkillForGame } from './updateTrueSkillRatings';
import { drainRatingOperations, resetRating, setGameCompletionHandler } from './rating-operations';
import { GameResultWorker } from './game-results';
import type { Server, StartedRoomState } from '@avalon/types';

let mongo: MongoMemoryServer;
const io = {
  to() {
    return io;
  },
  except() {
    return io;
  },
  emit() {},
};
function endedRoom(id = 'integrity-game') {
  const room = new Room(id, 'a', ['a', 'b', 'c', 'd', 'e'], io as unknown as Server);
  room.startGame();
  if (room.data.stage !== 'started') throw Error('fixture');
  room.data.manager.game.timer.startCustomTimer(120);
  room.data.manager.game.endGame('rejectedVote');
  return room.calculateRoomState() as StartedRoomState;
}
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([roomModel.init(), playerTrueSkillRatingModel.init(), gameTrueSkillResultModel.init()]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
beforeEach(async () => {
  for (const collection of await mongoose.connection.db!.collections()) await collection.deleteMany({});
});
afterEach(() => {
  jest.restoreAllMocks();
  eventBus.removeAllListeners();
  setGameCompletionHandler(async () => {});
});

test('ending with an active timer emits once and retrying persistence keeps one archive', async () => {
  let count = 0;
  eventBus.on('gameEnded', () => count++);
  const state = endedRoom();
  expect(count).toBe(1);
  const db = new DBManager(mongoose);
  await Promise.all([db.saveRoomToDB(state), db.saveRoomToDB(state)]);
  expect(await roomModel.countDocuments({ roomID: state.roomID })).toBe(1);
});

test('concurrent processing of one game applies one result to each player', async () => {
  const game = endedRoom().game;
  await Promise.all([updateTrueSkillForGame(game), updateTrueSkillForGame(game)]);
  expect((await playerTrueSkillRatingModel.find().lean()).map((r) => r.gamesCount)).toEqual([1, 1, 1, 1, 1]);
  expect(await gameTrueSkillResultModel.countDocuments({ gameID: game.uuid })).toBe(1);
});

test('retry resumes after a failed player write without skipping or double-counting players', async () => {
  const game = endedRoom().game;
  const original = playerTrueSkillRatingModel.updateOne.bind(playerTrueSkillRatingModel);
  let writes = 0;
  const spy = jest
    .spyOn(playerTrueSkillRatingModel, 'updateOne')
    .mockImplementation((...args: Parameters<typeof playerTrueSkillRatingModel.updateOne>) => {
      if ((args[1] as { $set?: { ratingSequence?: number } })?.$set?.ratingSequence && ++writes === 2)
        throw Error('injected write failure');
      return original(...args);
    });
  await expect(updateTrueSkillForGame(game)).rejects.toThrow('injected write failure');
  spy.mockRestore();
  await updateTrueSkillForGame(game);
  expect((await playerTrueSkillRatingModel.find().lean()).map((r) => r.gamesCount)).toEqual([1, 1, 1, 1, 1]);
});

test('different concurrent games preserve both counters and the second calculation', async () => {
  const first = endedRoom('first').game;
  const second = { ...first, uuid: 'second' };
  await Promise.all([updateTrueSkillForGame(first), updateTrueSkillForGame(second)]);
  const rows = await playerTrueSkillRatingModel.find().lean();
  expect(rows.map((r) => r.gamesCount)).toEqual([2, 2, 2, 2, 2]);
  const results = await gameTrueSkillResultModel.find().sort({ _id: 1 }).lean();
  for (const change of results[1].playerChanges) {
    const prior = results[0].playerChanges.find((p) => p.userID === change.userID)!;
    expect(change.oldMu).toBe(prior.newMu);
  }
});

test('completion failure is retried with the same sequence without repeating ratings', async () => {
  const game = endedRoom().game;
  const sequences: number[] = [];
  setGameCompletionHandler(async (_game, seq) => {
    sequences.push(seq);
    throw Error('completion failed');
  });
  await expect(updateTrueSkillForGame(game)).rejects.toThrow('completion failed');
  setGameCompletionHandler(async (_game, seq) => {
    sequences.push(seq);
  });
  await drainRatingOperations();
  expect(sequences).toEqual([1, 1]);
  expect((await playerTrueSkillRatingModel.find().lean()).map((r) => r.gamesCount)).toEqual([1, 1, 1, 1, 1]);
});

test('a stale worker cannot overwrite a later reset', async () => {
  const game = endedRoom().game;
  let release!: () => void;
  let arrived!: () => void;
  const blocked = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const original = playerTrueSkillRatingModel.updateOne.bind(playerTrueSkillRatingModel);
  let paused = false;
  jest
    .spyOn(playerTrueSkillRatingModel, 'updateOne')
    .mockImplementation((...args: Parameters<typeof playerTrueSkillRatingModel.updateOne>) => {
      if (!paused && (args[1] as { $set?: { ratingSequence?: number } })?.$set?.ratingSequence) {
        paused = true;
        arrived();
        return gate.then(() => original(...args)) as unknown as ReturnType<typeof playerTrueSkillRatingModel.updateOne>;
      }
      return original(...args);
    });
  const oldWorker = updateTrueSkillForGame(game);
  await blocked;
  await updateTrueSkillForGame(game);
  expect((await resetRating('a', 1)).success).toBe(true);
  release();
  await oldWorker;
  const rating = await playerTrueSkillRatingModel.findOne({ userID: 'a' }).lean();
  expect(rating).toMatchObject({ mu: 6000, sigma: 1500, gamesCount: 1 });
});

test('history pages preserve every game without returning an unbounded response', async () => {
  const state = endedRoom();
  await roomModel.insertMany(
    Array.from({ length: 405 }, (_, i) => ({
      ...state,
      roomID: `page-${i}`,
      game: { ...state.game, uuid: `page-${i}` },
    })),
  );
  const db = new DBManager(mongoose);
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await db.getPlayerGameSummariesPage('a', cursor);
    expect(page.games.length).toBeLessThanOrEqual(200);
    ids.push(...page.games.map((g) => g.uuid));
    cursor = page.nextCursor;
  } while (cursor);
  expect(new Set(ids).size).toBe(405);
  await expect(db.getPlayerGameSummaries('a')).rejects.toThrow('paginationRequired');
});

test('statistics remain cached under game traffic and refresh after one minute', async () => {
  const state = endedRoom();
  const db = new DBManager(mongoose);
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  await db.saveRoomToDB(state);
  expect((await db.getFullStats()).total.gamesCount).toBe(1);
  await db.saveRoomToDB({ ...state, roomID: 'another', game: { ...state.game, uuid: 'another' } });
  expect((await db.getFullStats()).total.gamesCount).toBe(1);
  clock.mockReturnValue(62000);
  expect((await db.getFullStats()).total.gamesCount).toBe(2);
});

test('history snapshot includes existing ObjectIds created by another backend in the same second', async () => {
  const state = endedRoom();
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  await roomModel.create({ ...state, _id: new mongoose.Types.ObjectId(`${timestamp}ffffffffffffffff`) });
  expect((await new DBManager(mongoose).getPlayerGameSummariesPage('a')).games.map((g) => g.uuid)).toEqual([
    state.game.uuid,
  ]);
});

test('a new result worker resumes the durable archive outbox after completion failure', async () => {
  const db = new DBManager(mongoose);
  const state = endedRoom();
  const failed = new GameResultWorker(db, async () => {
    throw Error('achievement unavailable');
  });
  await expect(failed.submit(state)).rejects.toThrow('achievement unavailable');
  expect((await roomModel.findOne({ roomID: state.roomID }))?.completionPending).toBe(true);
  const recovered = new GameResultWorker(db, async () => {});
  await recovered.flush();
  expect((await roomModel.findOne({ roomID: state.roomID }))?.completionPending).toBe(false);
  expect((await playerTrueSkillRatingModel.find().lean()).map((r) => r.gamesCount)).toEqual([1, 1, 1, 1, 1]);
});
