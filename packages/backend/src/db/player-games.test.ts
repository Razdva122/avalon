jest.mock('@/db/models/', () => ({ roomModel: { find: jest.fn() } }));
jest.mock('@/db/user', () => ({ UserLayer: class {} }));
jest.mock('@/db/init', () => ({}));
import { DBManager } from './index';
import { roomModel } from '@/db/models/';

test('loads only fields needed for player statistics, in chronological order without hydration', async () => {
  const game = { uuid: 'game', players: [{ id: 'user', role: 'merlin' }], result: { winner: 'good' } };
  const lean = jest.fn().mockResolvedValue([{ game }]);
  const sort = jest.fn().mockReturnValue({ lean });
  (roomModel.find as jest.Mock).mockReturnValue({ sort });
  const db = new DBManager(undefined);
  expect(await db.getPlayerGameSummaries('user')).toEqual([game]);
  expect(roomModel.find).toHaveBeenCalledWith(
    { 'players.id': 'user', 'game.stage': 'end', 'game.result.reason': { $ne: 'manualy' } },
    { _id: 0, 'game.uuid': 1, 'game.players.id': 1, 'game.players.role': 1, 'game.result.winner': 1 },
  );
  expect(sort).toHaveBeenCalledWith({ _id: 1 });
  expect(lean).toHaveBeenCalled();
});
