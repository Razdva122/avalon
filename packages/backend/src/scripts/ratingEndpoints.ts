import { TRoles, ServerSocket } from '@avalon/types';
import { readRoleHistory, readRoleRatings, roleRatingView } from './roleRatingStorage';

export function registerRatingEndpoints(socket: ServerSocket): void {
  socket.on('getRolesWithRatings', async (callback) => {
    const view = await roleRatingView();
    const roles = await view.collection
      .aggregate(
        [{ $match: { ...view.filter, rating: { $gt: 0 } } }, { $group: { _id: '$role' } }, { $sort: { _id: 1 } }],
        { maxTimeMS: 10000 },
      )
      .toArray();
    callback(roles.map((row) => row._id as TRoles));
  });
  socket.on('getRoleLeaderboard', async (role: TRoles, callback) => {
    callback(await readRoleRatings({ role }, { rank: 1 }, 20));
  });
  socket.on('getUserRatings', async (userID: string, callback) => {
    callback(await readRoleRatings({ userID }, { rating: -1, gamesCount: -1 }));
  });
  socket.on('getPopularRoles', async (minPlayers: number, callback) => {
    const view = await roleRatingView();
    const roles = await view.collection
      .aggregate(
        [
          { $match: { ...view.filter, rating: { $gt: 0 } } },
          { $group: { _id: '$role', playerCount: { $sum: 1 } } },
          { $match: { playerCount: { $gte: minPlayers } } },
          { $project: { role: '$_id', playerCount: 1, _id: 0 } },
          { $sort: { playerCount: -1 } },
        ],
        { maxTimeMS: 10000 },
      )
      .toArray();
    callback(roles as { role: TRoles; playerCount: number }[]);
  });
  socket.on('getRatingHistory', async (userID: string, role: TRoles, callback) => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    callback(await readRoleHistory(userID, role, start));
  });
  socket.on('getTopPlayersForPopularRoles', async (minPlayers: number, callback) => {
    const view = await roleRatingView();
    // One captured generation serves both queries even if publication occurs between them.
    const roles = await view.collection
      .aggregate(
        [
          { $match: { ...view.filter, rating: { $gt: 0 } } },
          { $group: { _id: '$role', playerCount: { $sum: 1 } } },
          { $match: { playerCount: { $gte: minPlayers } } },
          { $sort: { playerCount: -1 } },
        ],
        { maxTimeMS: 10000 },
      )
      .toArray();
    const result = await Promise.all(
      roles.map(async (row) => ({
        role: row._id as TRoles,
        topPlayer: await view.collection.findOne(
          { ...view.filter, role: row._id },
          {
            sort: { rank: 1 },
            projection: { generation: 0, _id: 0, date: 0, createdAt: 0, retiredAt: 0 },
            maxTimeMS: 10000,
          },
        ),
      })),
    );
    callback(result as Parameters<typeof callback>[0]);
  });
}
