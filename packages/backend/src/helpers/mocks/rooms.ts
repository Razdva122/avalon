import type { TRoomsList } from '@avalon/types';

export const fakeRooms: TRoomsList = [
  {
    host: 'evie ',
    state: 'started',
    options: {
      addons: {},
      roles: {
        merlin: 1,
        percival: 1,
        mordred: 1,
        goodLancelot: 1,
        evilLancelot: 1,
        guinevere: 1,
      },
      features: {
        anonymousVoting: true,
      },
    },
    startAt: 'Sun Jan 26 2025 22:26:00 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sun Jan 26 2025 22:25:55 GMT+0000 (Coordinated Universal Time)',
    uuid: '123-456-789-1',
    players: 8,
    result: {
      winner: 'evil',
      reason: 'evilTeamMissions',
    },
  },
  {
    host: 'Dmitrii',
    state: 'started',
    options: {
      addons: {
        ladyOfLake: true,
        excalibur: true,
      },
      roles: {
        merlin: 1,
        percival: 1,
        morgana: 1,
        mordred: 1,
      },
      features: {
        displayIndex: true,
        anonymousVoting: false,
      },
    },
    startAt: 'Sat Oct 12 2024 10:58:57 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sat Oct 12 2024 10:58:44 GMT+0000 (Coordinated Universal Time)',
    uuid: '123-456-789',
    players: 8,
    result: {
      winner: 'evil',
      reason: 'evilTeamMissions',
    },
  },
  {
    host: 'Dmitrii',
    state: 'started',
    options: {
      addons: {
        ladyOfLake: true,
        excalibur: true,
      },
      roles: {
        merlin: 1,
        percival: 1,
        morgana: 1,
        mordred: 1,
      },
      features: {
        displayIndex: true,
        anonymousVoting: false,
      },
    },
    startAt: 'Sat Oct 12 2024 09:43:21 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sat Oct 12 2024 09:35:31 GMT+0000 (Coordinated Universal Time)',
    uuid: '123-456-789-0',
    players: 7,
    result: {
      winner: 'evil',
      reason: 'killMerlin',
    },
  },
];
