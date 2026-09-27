import { DBManager } from './index';
import { roomModel } from './models';
import { Encoder, PacketType } from 'socket.io-parser';
import { validPacket } from '@/security/validation';

afterEach(() => jest.restoreAllMocks());

test('the initial history cursor survives the actual Socket.IO wire encoding', () => {
  const wire = new Encoder().encode({
    type: PacketType.EVENT,
    nsp: '/',
    data: ['getPlayerGameSummariesPage', 'user', undefined],
  })[0] as string;
  const [event, userID, cursor] = JSON.parse(wire.slice(1));
  expect(cursor).toBe(null);
  expect(validPacket(event, [userID, cursor, () => {}])).toBe(true);
});
test.each([['room', 'victim'], { $ne: null }, '', 'bad.id', 'x'.repeat(81)])(
  'rejects unsafe IDs before querying: %p',
  async (id) => {
    const findOne = jest.spyOn(roomModel, 'findOne').mockResolvedValue(null);
    const find = jest.spyOn(roomModel, 'find').mockResolvedValue([]);
    const db = new DBManager(undefined);
    for (const method of [
      'getRoomFromDB',
      'getPlayerGames',
      'getPlayerGameSummaries',
      'getPlayerGameSummariesPage',
    ] as const)
      await expect(db[method](id as string)).rejects.toThrow('Invalid ID');
    expect(findOne).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  },
);

test('statistics share a pending calculation and permit retry after its failure', async () => {
  let reject!: (error: Error) => void;
  const failed = new Promise<never>((_, no) => {
    reject = no;
  });
  const aggregate = jest.spyOn(roomModel, 'aggregate').mockImplementation(() => ({ option: () => failed }) as never);
  const db = new DBManager(undefined);
  const pending = Promise.allSettled([db.getFullStats(), db.getFullStats()]);
  reject(Error('temporarily unavailable'));
  expect((await pending).map((r) => r.status)).toEqual(['rejected', 'rejected']);
  expect(aggregate).toHaveBeenCalledTimes(1);
  aggregate.mockImplementation(
    () =>
      ({
        option: async () => [{ byPlayers: [{ gamesCount: 2, goodWins: 1, evilWins: 1 }], roles: [], addons: [] }],
      }) as never,
  );
  expect((await db.getFullStats()).total).toMatchObject({
    gamesCount: 2,
    goodWinPercentage: 50,
    evilWinPercentage: 50,
  });
});

test.each(['x', 'a'.repeat(24), { $gt: '' }, 'a'.repeat(24) + ':' + 'z'.repeat(24)])(
  'rejects malformed history cursor %p',
  async (cursor) => {
    await expect(new DBManager(undefined).getPlayerGameSummariesPage('user', cursor as string)).rejects.toThrow(
      'Invalid history cursor',
    );
  },
);
