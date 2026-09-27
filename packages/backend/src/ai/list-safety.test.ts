import { AiRepository } from './repository';
import type { Db } from 'mongodb';
import type { StartedRoomState, TRoomInfo } from '@avalon/types';

test('lobby summaries use a projection, share concurrent reads, expire, and invalidate on save', async () => {
  let reads = 0;
  const projections: unknown[] = [];
  const indexes: unknown[] = [];
  let status = 'finished';
  const collection = {
    createIndex: async (index: unknown) => {
      indexes.push(index);
    },
    updateOne: async () => ({}),
    find: (_query: unknown, options: { projection: unknown }) => {
      reads++;
      projections.push(options.projection);
      return {
        sort: () => ({
          limit: () => ({
            toArray: async () => [
              {
                state: {
                  roomID: 'room',
                  ai: { status, model: 'model' },
                  stage: 'started',
                  leaderID: 'host',
                  players: [{ id: 'bot' }],
                  options: {},
                  createAt: '2026-09-27',
                  game: { result: { winner: 'good' } },
                },
              },
            ],
          }),
        }),
      };
    },
  };
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    const repo = new AiRepository({ collection: () => collection } as unknown as Db) as AiRepository & {
      recentSummaries(): Promise<TRoomInfo[]>;
    };
    const results = await Promise.all(Array.from({ length: 12 }, () => repo.recentSummaries()));
    expect(reads).toBe(1);
    expect(results[0][0]).toMatchObject({ uuid: 'room', aiStatus: 'finished', players: 1 });
    expect(results[0][0]).not.toHaveProperty('game');
    expect(projections[0]).toMatchObject({ 'state.game.result': 1 });
    expect(projections[0]).not.toHaveProperty('state.game');
    expect(indexes).toContainEqual({ 'state.createAt': -1 });
    status = 'paused';
    await repo.save({ stage: 'started', roomID: 'room' } as StartedRoomState);
    expect((await repo.recentSummaries())[0].aiStatus).toBe('stopped');
    expect(reads).toBe(2);
    now.mockReturnValue(17000);
    await repo.recentSummaries();
    expect(reads).toBe(3);
    await expect(repo.load(['room'] as unknown as string)).rejects.toThrow('Invalid ID');
  } finally {
    now.mockRestore();
  }
});

test('AI persistence rejects object and array IDs before touching the database', async () => {
  const repo = new AiRepository({
    collection: () => {
      throw Error('database touched');
    },
  } as unknown as Db);
  for (const id of [['room'], { $ne: null }, '', 'bad.id', 'x'.repeat(81)]) {
    for (const method of ['load', 'claim', 'release', 'roomCost', 'roomLimit'] as const)
      await expect(repo[method](id as string)).rejects.toThrow('Invalid ID');
    await expect(repo.reserve(id as string, 1)).rejects.toThrow('Invalid ID');
    await expect(repo.settle(id as string, 1, 1)).rejects.toThrow('Invalid ID');
    await expect(repo.doubleMatchLimit(id as string, 1)).rejects.toThrow('Invalid ID');
  }
});
