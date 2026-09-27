import { DBManager } from './index';
import { roomModel } from './models';
import type { StartedRoomState } from '@avalon/types';

afterEach(() => jest.restoreAllMocks());

test.each([['room', 'victim'], { $ne: null }, '', 'bad.id', 'x'.repeat(81)])(
  'rejects unsafe IDs before querying: %p',
  async (id) => {
    const findOne = jest.spyOn(roomModel, 'findOne').mockResolvedValue(null);
    const find = jest.spyOn(roomModel, 'find').mockResolvedValue([]);
    const db = new DBManager(undefined);
    for (const method of ['getRoomFromDB', 'getPlayerGames', 'getPlayerGameSummaries'] as const)
      await expect(db[method](id as string)).rejects.toThrow('Invalid ID');
    expect(findOne).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  },
);

test('statistics share work, expire, and invalidate only after a successful save', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  let count = 1;
  const aggregate = jest.spyOn(roomModel, 'aggregate').mockImplementation(() => {
    const result = Promise.resolve([{ gamesCount: count, goodWins: count, evilWins: 0 }]);
    return Object.assign(result, { option: () => result }) as never;
  });
  const save = jest
    .spyOn(roomModel.prototype as unknown as { save(): Promise<void> }, 'save')
    .mockResolvedValue(undefined);
  const db = new DBManager(undefined);
  const stats = await Promise.all(Array.from({ length: 12 }, () => db.getFullStats()));
  expect(stats[0].total.gamesCount).toBe(1);
  expect(aggregate).toHaveBeenCalledTimes(3);
  count = 2;
  expect((await db.getFullStats()).total.gamesCount).toBe(1);
  await db.saveRoomToDB({} as StartedRoomState);
  expect((await db.getFullStats()).total.gamesCount).toBe(2);
  count = 3;
  save.mockRejectedValueOnce(Error('write failed'));
  await expect(db.saveRoomToDB({} as StartedRoomState)).rejects.toThrow('write failed');
  expect((await db.getFullStats()).total.gamesCount).toBe(2);
  now.mockReturnValue(62000);
  expect((await db.getFullStats()).total.gamesCount).toBe(3);
});

test('statistics failures can retry and a concurrent save cannot poison the cache', async () => {
  let resolve!: (value: { gamesCount: number; goodWins: number; evilWins: number }[]) => void;
  const delayed = new Promise<{ gamesCount: number; goodWins: number; evilWins: number }[]>((done) => {
    resolve = done;
  });
  const aggregate = jest
    .spyOn(roomModel, 'aggregate')
    .mockImplementation(() => Object.assign(delayed, { option: () => delayed }) as never);
  jest.spyOn(roomModel.prototype as unknown as { save(): Promise<void> }, 'save').mockResolvedValue(undefined);
  const db = new DBManager(undefined);
  const first = db.getFullStats();
  await db.saveRoomToDB({} as StartedRoomState);
  resolve([{ gamesCount: 1, goodWins: 1, evilWins: 0 }]);
  await first;
  aggregate.mockImplementation(() => {
    const result = Promise.resolve([{ gamesCount: 2, goodWins: 2, evilWins: 0 }]);
    return Object.assign(result, { option: () => result }) as never;
  });
  expect((await db.getFullStats()).total.gamesCount).toBe(2);
  const other = new DBManager(undefined);
  aggregate.mockImplementationOnce(() => {
    throw Error('query failed');
  });
  await expect(other.getFullStats()).rejects.toThrow('query failed');
  expect((await other.getFullStats()).total.gamesCount).toBe(2);
});

test('only legacy full replays are capped; player summaries retain every game', async () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({ game: { uuid: String(i) } }));
  const find = jest.spyOn(roomModel, 'find').mockImplementation(() => {
    let limit = rows.length;
    const cursor = {
      sort: () => cursor,
      limit: (value: number) => {
        limit = value;
        return cursor;
      },
      maxTimeMS: () => cursor,
      lean: async () => rows.slice(0, limit),
      then: (resolve: (value: unknown) => void) => Promise.resolve(rows.slice(0, limit)).then(resolve),
    };
    return cursor as never;
  });
  const db = new DBManager(undefined);
  expect(await db.getPlayerGames('player')).toHaveLength(100);
  expect(await db.getPlayerGameSummaries('player')).toHaveLength(120);
  expect(find).toHaveBeenCalledTimes(2);
});
