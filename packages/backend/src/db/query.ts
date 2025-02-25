import { TOptionalRoles } from '@avalon/types';

const optionalRoles: { [key in TOptionalRoles]: true } = {
  merlin: true,
  merlinPure: true,
  tristan: true,
  isolde: true,
  goodLancelot: true,
  guinevere: true,
  troublemaker: true,
  cleric: true,
  morgana: true,
  oberon: true,
  mordred: true,
  evilLancelot: true,
  percival: true,
  trickster: true,
  lunatic: true,
  brute: true,
  witch: true,
  revealer: true,
};

export const query = {
  statsByPlayers: [
    { $match: { 'game.stage': 'end', 'game.result.reason': { $ne: 'manualy' } } },

    {
      $addFields: {
        playerCount: { $size: '$players' },
      },
    },

    {
      $group: {
        _id: { playerCount: '$playerCount', winner: '$game.result.winner' },
        totalGames: { $sum: 1 },
      },
    },

    {
      $group: {
        _id: '$_id.playerCount',
        gamesCount: { $sum: '$totalGames' },
        goodWins: {
          $sum: {
            $cond: [{ $eq: ['$_id.winner', 'good'] }, '$totalGames', 0],
          },
        },
        evilWins: {
          $sum: {
            $cond: [{ $eq: ['$_id.winner', 'evil'] }, '$totalGames', 0],
          },
        },
      },
    },

    {
      $project: {
        _id: 0,
        playerCount: '$_id',
        gamesCount: 1,
        goodWinPercentage: {
          $multiply: [{ $divide: ['$goodWins', { $add: ['$goodWins', '$evilWins'] }] }, 100],
        },
        evilWinPercentage: {
          $multiply: [{ $divide: ['$evilWins', { $add: ['$goodWins', '$evilWins'] }] }, 100],
        },
        goodWins: '$goodWins',
        evilWins: '$evilWins',
      },
    },

    { $sort: { playerCount: <const>1 } },
  ],
  rolesStats: [
    { $match: { 'game.stage': 'end', 'game.result.reason': { $ne: 'manualy' } } },
    {
      $addFields: {
        rolesArray: { $objectToArray: '$options.roles' },
      },
    },
    { $unwind: { path: '$rolesArray' } },
    {
      $match: {
        'rolesArray.k': { $in: Object.keys(optionalRoles) },
        'rolesArray.v': 1,
      },
    },
    {
      $group: {
        _id: { role: '$rolesArray.k', winner: '$game.result.winner' },
        totalGames: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.role',
        gamesCount: { $sum: '$totalGames' },
        goodWins: {
          $sum: {
            $cond: [{ $eq: ['$_id.winner', 'good'] }, '$totalGames', 0],
          },
        },
        evilWins: {
          $sum: {
            $cond: [{ $eq: ['$_id.winner', 'evil'] }, '$totalGames', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        role: '$_id',
        gamesCount: 1,
        goodWinPercentage: {
          $multiply: [
            {
              $cond: [
                { $eq: [{ $add: ['$goodWins', '$evilWins'] }, 0] },
                0,
                { $divide: ['$goodWins', { $add: ['$goodWins', '$evilWins'] }] },
              ],
            },
            100,
          ],
        },
        evilWinPercentage: {
          $multiply: [
            {
              $cond: [
                { $eq: [{ $add: ['$goodWins', '$evilWins'] }, 0] },
                0,
                { $divide: ['$evilWins', { $add: ['$goodWins', '$evilWins'] }] },
              ],
            },
            100,
          ],
        },
        goodWins: 1,
        evilWins: 1,
      },
    },
    { $sort: { role: <const>1 } },
  ],
};
