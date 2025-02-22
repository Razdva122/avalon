import type { TRoomState } from '@avalon/types';

export const fakeGames: TRoomState[] = [
  {
    roomID: '123-456-789',
    leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
    startAt: 'Sat Oct 12 2024 10:58:57 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sat Oct 12 2024 10:58:44 GMT+0000 (Coordinated Universal Time)',
    chat: [],
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
    players: [
      {
        name: 'Ina S',
        id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        isLeader: false,
      },
      {
        name: 'Dmitrii',
        id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
        isLeader: true,
      },
      {
        name: 'компот',
        id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
        isLeader: false,
      },
      {
        name: 'vkurilin',
        id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
        isLeader: false,
      },
      {
        name: 'Максон',
        id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
        isLeader: false,
      },
      {
        name: 'Birzhan',
        id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
        isLeader: false,
      },
      {
        name: 'anT',
        id: '30a2912c-9030-4c94-bc52-ecc15383cb6c',
        isLeader: false,
      },
    ],
    stage: 'started',
    game: {
      result: {
        winner: 'evil',
        reason: 'evilTeamMissions',
      },
      uuid: '5f1d754b-a5de-49e0-9e58-22825dfdf848',
      stage: 'end',
      vote: 3,
      mission: 4,
      missionState: [
        {
          players: 3,
          failsRequired: 1,
          fails: 0,
          result: 'success',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 1,
          result: 'fail',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 1,
          result: 'fail',
        },
        {
          players: 5,
          failsRequired: 2,
          fails: 1,
          result: 'success',
        },
        {
          players: 5,
          failsRequired: 1,
          fails: 2,
          result: 'fail',
        },
      ],
      settings: {
        missions: [
          {
            players: 3,
            failsRequired: 1,
          },
          {
            players: 4,
            failsRequired: 1,
          },
          {
            players: 4,
            failsRequired: 1,
          },
          {
            players: 5,
            failsRequired: 2,
          },
          {
            players: 5,
            failsRequired: 1,
          },
        ],
        players: {
          good: 5,
          evil: 3,
        },
        total: 8,
        roles: {
          evil: ['mordred', 'morgana', 'minion'],
          good: ['merlin', 'percival', 'servant', 'servant', 'servant'],
        },
      },
      addonsData: {
        assassin: {
          assassinateTargets: ['merlin'],
        },
      },
      features: {
        displayIndex: true,
        anonymousVoting: false,
      },
      history: [
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 3,
          forced: false,
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              excalibur: true,
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 4,
          forced: true,
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          switcherID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        },
        {
          type: 'mission',
          hidden: false,
          index: 0,
          result: 'success',
          settings: {
            players: 3,
            failsRequired: 1,
          },
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          fails: 0,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              value: 'success',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              value: 'success',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 3,
          forced: false,
          leaderID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          team: [
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              excalibur: true,
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 4,
          forced: true,
          leaderID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          switcherID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        },
        {
          type: 'mission',
          hidden: false,
          index: 1,
          result: 'fail',
          settings: {
            players: 4,
            failsRequired: 1,
          },
          leaderID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          fails: 1,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              value: 'success',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              value: 'fail',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              value: 'success',
            },
          ],
        },
        {
          type: 'checkLoyalty',
          result: 'good',
          visibleLoyalty: 'good',
          validatorID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          inspectedID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              excalibur: true,
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              excalibur: true,
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              excalibur: true,
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 3,
          forced: false,
          leaderID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              excalibur: true,
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 4,
          forced: true,
          leaderID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              excalibur: true,
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          result: 'fail',
          switcherID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          targetID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
        },
        {
          type: 'mission',
          hidden: false,
          index: 2,
          result: 'fail',
          settings: {
            players: 4,
            failsRequired: 1,
          },
          leaderID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
          fails: 1,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              value: 'success',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              value: 'success',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              switchedBy: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              value: 'fail',
            },
          ],
        },
        {
          type: 'checkLoyalty',
          result: 'good',
          visibleLoyalty: 'good',
          validatorID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          inspectedID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
        },
        {
          type: 'vote',
          result: 'approve',
          index: 0,
          forced: false,
          leaderID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          result: 'fail',
          switcherID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          targetID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
        },
        {
          type: 'mission',
          hidden: false,
          index: 3,
          result: 'success',
          settings: {
            players: 5,
            failsRequired: 2,
          },
          leaderID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          fails: 1,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              value: 'success',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              value: 'success',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              switchedBy: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              value: 'fail',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              value: 'success',
            },
          ],
        },
        {
          type: 'checkLoyalty',
          result: 'good',
          visibleLoyalty: 'good',
          validatorID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          inspectedID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          team: [
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          team: [
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              excalibur: true,
            },
            {
              id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 3,
          forced: false,
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          team: [
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
              onMission: false,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          result: 'fail',
          switcherID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          targetID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
        },
        {
          type: 'mission',
          hidden: false,
          index: 4,
          result: 'fail',
          settings: {
            players: 5,
            failsRequired: 1,
          },
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          fails: 2,
          actions: [
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'fail',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              value: 'success',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              value: 'success',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              switchedBy: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'fail',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              value: 'success',
            },
          ],
        },
      ],
      players: [
        {
          id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          index: 8,
          name: 'Ina S',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            ladyOfLake: 'used',
            excalibur: false,
            waitForAction: false,
          },
          role: 'percival',
        },
        {
          id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          index: 1,
          name: 'Ivan',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'mordred',
        },
        {
          id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          index: 2,
          name: '米莎',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
            ladyOfLake: 'used',
          },
          role: 'servant',
        },
        {
          id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          index: 3,
          name: 'Dmitrii',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
            ladyOfLake: 'used',
          },
          role: 'servant',
          validMissionsResult: ['success'],
        },
        {
          id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          index: 4,
          name: 'компот',
          features: {
            isSelected: false,
            isLeader: true,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'merlin',
        },
        {
          id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          index: 5,
          name: 'vkurilin',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'morgana',
        },
        {
          id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          index: 6,
          name: 'Максон',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
            ladyOfLake: 'has',
          },
          role: 'servant',
        },
        {
          id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
          index: 7,
          name: 'Birzhan',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'minion',
        },
      ],
    },
  },
  {
    roomID: '123-456-789-0',
    leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
    startAt: 'Sat Oct 12 2024 09:43:21 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sat Oct 12 2024 09:35:31 GMT+0000 (Coordinated Universal Time)',
    chat: [
      {
        message: 'я могу сыграть если что  ',
        user: {
          id: '486c33a4-6284-4880-96d8-e0ee6a3be679',
          name: 'илияс',
        },
        timestamp: 1728728517953,
      },
      {
        message: ' вы неиграете уже ?',
        user: {
          id: '486c33a4-6284-4880-96d8-e0ee6a3be679',
          name: 'илияс',
        },
        timestamp: 1728729116478,
      },
      {
        message: 'У нас пока хватает народу своих, если нужно будет +1 я напишу',
        user: {
          id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          name: 'Dmitrii',
        },
        timestamp: 1728729277562,
      },
    ],
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
    players: [
      {
        name: 'Ina S',
        id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        isLeader: false,
      },
      {
        name: 'Dmitrii',
        id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
        isLeader: true,
      },
      {
        name: 'компот',
        id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
        isLeader: false,
      },
      {
        name: 'vkurilin',
        id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
        isLeader: false,
      },
      {
        name: 'Максон',
        id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
        isLeader: false,
      },
      {
        name: 'Birzhan',
        id: '86d0b748-bc9f-4a7c-90f3-b2f3327be004',
        isLeader: false,
      },
      {
        name: 'anT',
        id: '30a2912c-9030-4c94-bc52-ecc15383cb6c',
        isLeader: false,
      },
    ],
    stage: 'started',
    game: {
      result: {
        winner: 'evil',
        reason: 'killMerlin',
      },
      uuid: 'e9265a15-971d-4c9a-86a4-3f458fa64a04',
      stage: 'end',
      vote: 0,
      mission: 2,
      missionState: [
        {
          players: 3,
          failsRequired: 1,
          fails: 0,
          result: 'success',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 0,
          result: 'success',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 0,
          result: 'success',
        },
        {
          players: 5,
          failsRequired: 2,
        },
        {
          players: 5,
          failsRequired: 1,
        },
      ],
      settings: {
        missions: [
          {
            players: 2,
            failsRequired: 1,
          },
          {
            players: 3,
            failsRequired: 1,
          },
          {
            players: 3,
            failsRequired: 1,
          },
          {
            players: 4,
            failsRequired: 2,
          },
          {
            players: 4,
            failsRequired: 1,
          },
        ],
        players: {
          good: 4,
          evil: 3,
        },
        total: 7,
        roles: {
          evil: ['mordred', 'morgana', 'minion'],
          good: ['merlin', 'percival', 'servant', 'servant'],
        },
      },
      addonsData: {
        assassin: {
          assassinateTargets: ['merlin'],
        },
      },
      features: {
        displayIndex: true,
        anonymousVoting: false,
      },
      history: [
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          team: [
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          team: [
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          team: [
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              excalibur: true,
            },
            {
              id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 3,
          forced: false,
          leaderID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 4,
          forced: true,
          leaderID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              excalibur: true,
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          switcherID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        },
        {
          type: 'mission',
          hidden: false,
          index: 0,
          result: 'success',
          settings: {
            players: 2,
            failsRequired: 1,
          },
          leaderID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          fails: 0,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'success',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
            {
              id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 1,
          forced: false,
          leaderID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          team: [
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              excalibur: true,
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 2,
          forced: false,
          leaderID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
            {
              id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 3,
          forced: false,
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
            {
              id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'switchResult',
          result: 'success',
          switcherID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          targetID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
        },
        {
          type: 'mission',
          hidden: false,
          index: 1,
          result: 'success',
          settings: {
            players: 3,
            failsRequired: 1,
          },
          leaderID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          fails: 0,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'success',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              switchedBy: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'success',
            },
          ],
        },
        {
          type: 'checkLoyalty',
          result: 'good',
          visibleLoyalty: 'good',
          validatorID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          inspectedID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
        },
        {
          type: 'vote',
          result: 'approve',
          index: 0,
          forced: false,
          leaderID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          team: [
            {
              id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
            },
            {
              id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              excalibur: true,
            },
            {
              id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
              onMission: false,
              value: 'approve',
            },
          ],
        },
        {
          type: 'switchResult',
          switcherID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
        },
        {
          type: 'mission',
          hidden: false,
          index: 2,
          result: 'success',
          settings: {
            players: 3,
            failsRequired: 1,
          },
          leaderID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          fails: 0,
          actions: [
            {
              playerID: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
              value: 'success',
            },
            {
              playerID: '6e9030a7-1281-424b-8173-b5c4497ccd46',
              value: 'success',
            },
            {
              playerID: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
              value: 'success',
            },
          ],
        },
        {
          type: 'assassinate',
          assassinateType: 'merlin',
          result: 'hit',
          assassinID: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          killedIDs: ['ae1e897d-b99f-4a09-869f-4ce3c53afab9'],
        },
      ],
      players: [
        {
          id: '4e77db6a-6643-4379-92a6-0a9b8e678c44',
          index: 4,
          name: 'Ina S',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
            ladyOfLake: 'has',
          },
          role: 'percival',
        },
        {
          id: '6e9030a7-1281-424b-8173-b5c4497ccd46',
          index: 5,
          name: 'Ivan',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'servant',
        },
        {
          id: '336fdc47-e426-46e8-8bed-25b6ec6e9300',
          index: 6,
          name: '米莎',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'morgana',
        },
        {
          id: 'ae1e897d-b99f-4a09-869f-4ce3c53afab9',
          index: 7,
          name: 'Dmitrii',
          features: {
            isSelected: true,
            isLeader: false,
            isSent: false,
            ladyOfLake: 'used',
            excalibur: false,
            waitForAction: false,
          },
          role: 'merlin',
          validMissionsResult: ['success'],
        },
        {
          id: '38ddc7d6-b4fd-4be5-ac41-b000ae03a97f',
          index: 1,
          name: 'компот',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'servant',
        },
        {
          id: 'ef0d9439-6ca4-4fc8-aa2a-805b63c4581b',
          index: 2,
          name: 'vkurilin',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
            excalibur: false,
          },
          role: 'mordred',
        },
        {
          id: 'ec262bd3-c78f-4929-9659-fc98c36337b8',
          index: 3,
          name: 'Максон',
          features: {
            isSelected: false,
            isLeader: true,
            isSent: false,
            waitForAction: false,
            excalibur: false,
            isAssassin: true,
          },
          role: 'minion',
        },
      ],
    },
  },
  {
    roomID: '123-456-789-1',
    leaderID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
    startAt: 'Sun Jan 26 2025 22:26:00 GMT+0000 (Coordinated Universal Time)',
    createAt: 'Sun Jan 26 2025 22:25:55 GMT+0000 (Coordinated Universal Time)',
    chat: [],
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
    players: [
      {
        name: 'evie ',
        id: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
        isLeader: true,
      },
      {
        name: 'Rajesh Gaire',
        id: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
        isLeader: false,
      },
      {
        name: 'Zahraa',
        id: 'c93192d6-030f-480d-a1e6-160db4311e5f',
        isLeader: false,
      },
      {
        name: 'Ishfaaq',
        id: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
        isLeader: false,
      },
      {
        name: 'George Le Fay',
        id: 'bd213310-377d-481f-b26c-829d27fb00c4',
        isLeader: false,
      },
      {
        name: 'Ze You',
        id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
        isLeader: false,
      },
      {
        name: 'Yash',
        id: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
        isLeader: false,
      },
      {
        name: 'ivy',
        id: '90c12cf0-4880-44da-becf-634fc0650ebc',
        isLeader: false,
      },
    ],
    stage: 'started',
    game: {
      result: {
        winner: 'evil',
        reason: 'evilTeamMissions',
      },
      uuid: 'f810d660-4087-4eb5-b928-fb45c4672450',
      stage: 'end',
      vote: 0,
      mission: 3,
      missionState: [
        {
          players: 3,
          failsRequired: 1,
          fails: 1,
          result: 'fail',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 0,
          result: 'success',
        },
        {
          players: 4,
          failsRequired: 1,
          fails: 1,
          result: 'fail',
        },
        {
          players: 5,
          failsRequired: 2,
          fails: 2,
          result: 'fail',
        },
        {
          players: 5,
          failsRequired: 1,
        },
      ],
      settings: {
        missions: [
          {
            players: 3,
            failsRequired: 1,
          },
          {
            players: 4,
            failsRequired: 1,
          },
          {
            players: 4,
            failsRequired: 1,
          },
          {
            players: 5,
            failsRequired: 2,
          },
          {
            players: 5,
            failsRequired: 1,
          },
        ],
        players: {
          good: 5,
          evil: 3,
        },
        total: 8,
        roles: {
          evil: ['mordred', 'evilLancelot', 'minion'],
          good: ['merlin', 'percival', 'guinevere', 'goodLancelot', 'servant'],
        },
      },
      addonsData: {
        assassin: {
          assassinateTargets: ['merlin', 'guinevere'],
        },
      },
      features: {
        anonymousVoting: true,
      },
      history: [
        {
          type: 'vote',
          result: 'approve',
          index: 0,
          forced: false,
          leaderID: '90c12cf0-4880-44da-becf-634fc0650ebc',
          team: [
            {
              id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
            },
            {
              id: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
            },
            {
              id: '90c12cf0-4880-44da-becf-634fc0650ebc',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'mission',
          hidden: false,
          index: 0,
          result: 'fail',
          settings: {
            players: 3,
            failsRequired: 1,
          },
          leaderID: '90c12cf0-4880-44da-becf-634fc0650ebc',
          fails: 1,
          actions: [
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              value: 'success',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              value: 'success',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              value: 'fail',
            },
          ],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
          team: [
            {
              id: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
            },
            {
              id: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
            },
            {
              id: 'bd213310-377d-481f-b26c-829d27fb00c4',
            },
            {
              id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 1,
          forced: false,
          leaderID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
          team: [
            {
              id: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
            },
            {
              id: 'bd213310-377d-481f-b26c-829d27fb00c4',
            },
            {
              id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
            },
            {
              id: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'mission',
          hidden: false,
          index: 1,
          result: 'success',
          settings: {
            players: 4,
            failsRequired: 1,
          },
          leaderID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
          fails: 0,
          actions: [
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              value: 'success',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              value: 'success',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              value: 'success',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              value: 'success',
            },
          ],
        },
        {
          type: 'switchLancelots',
          lancelotsIDs: {
            good: 'bd213310-377d-481f-b26c-829d27fb00c4',
            evil: '90c12cf0-4880-44da-becf-634fc0650ebc',
          },
          result: true,
          pointer: 0,
          switches: [true, false, false, true, false],
        },
        {
          type: 'vote',
          result: 'reject',
          index: 0,
          forced: false,
          leaderID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
          team: [
            {
              id: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
            },
            {
              id: 'c93192d6-030f-480d-a1e6-160db4311e5f',
            },
            {
              id: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
            },
            {
              id: 'bd213310-377d-481f-b26c-829d27fb00c4',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: false,
              value: 'reject',
            },
          ],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 1,
          forced: false,
          leaderID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
          team: [
            {
              id: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
            },
            {
              id: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
            },
            {
              id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
            },
            {
              id: '90c12cf0-4880-44da-becf-634fc0650ebc',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'mission',
          hidden: false,
          index: 2,
          result: 'fail',
          settings: {
            players: 4,
            failsRequired: 1,
          },
          leaderID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
          fails: 1,
          actions: [
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              value: 'success',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              value: 'fail',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              value: 'success',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              value: 'success',
            },
          ],
        },
        {
          type: 'switchLancelots',
          lancelotsIDs: {
            good: '90c12cf0-4880-44da-becf-634fc0650ebc',
            evil: 'bd213310-377d-481f-b26c-829d27fb00c4',
          },
          result: false,
          pointer: 1,
          switches: [true, false, false, true, false],
        },
        {
          type: 'vote',
          result: 'approve',
          index: 0,
          forced: false,
          leaderID: 'bd213310-377d-481f-b26c-829d27fb00c4',
          team: [
            {
              id: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
            },
            {
              id: 'c93192d6-030f-480d-a1e6-160db4311e5f',
            },
            {
              id: 'bd213310-377d-481f-b26c-829d27fb00c4',
            },
            {
              id: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
            },
            {
              id: '90c12cf0-4880-44da-becf-634fc0650ebc',
            },
          ],
          anonymous: false,
          votes: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              onMission: true,
              value: 'reject',
            },
            {
              playerID: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
              onMission: false,
              value: 'reject',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
              onMission: false,
              value: 'approve',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              onMission: true,
              value: 'approve',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              onMission: true,
              value: 'approve',
            },
          ],
        },
        {
          type: 'mission',
          hidden: false,
          index: 3,
          result: 'fail',
          settings: {
            players: 5,
            failsRequired: 2,
          },
          leaderID: 'bd213310-377d-481f-b26c-829d27fb00c4',
          fails: 2,
          actions: [
            {
              playerID: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
              value: 'fail',
            },
            {
              playerID: 'c93192d6-030f-480d-a1e6-160db4311e5f',
              value: 'success',
            },
            {
              playerID: 'bd213310-377d-481f-b26c-829d27fb00c4',
              value: 'fail',
            },
            {
              playerID: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
              value: 'success',
            },
            {
              playerID: '90c12cf0-4880-44da-becf-634fc0650ebc',
              value: 'success',
            },
          ],
        },
      ],
      players: [
        {
          id: 'e4b4eb29-7992-40f3-a5c5-181a1d2585c4',
          index: 2,
          name: 'evie ',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'minion',
        },
        {
          id: 'a5aa652a-2aec-44b2-ab01-b798f7129d9f',
          index: 3,
          name: 'Rajesh Gaire',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'percival',
        },
        {
          id: 'c93192d6-030f-480d-a1e6-160db4311e5f',
          index: 4,
          name: 'Zahraa',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'guinevere',
        },
        {
          id: 'a5b5e85f-7f6d-4a4b-b6f5-2452826743f0',
          index: 5,
          name: 'Ishfaaq',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'mordred',
        },
        {
          id: 'bd213310-377d-481f-b26c-829d27fb00c4',
          index: 6,
          name: 'George Le Fay',
          features: {
            isSelected: false,
            isLeader: true,
            isSent: false,
            waitForAction: false,
          },
          role: 'evilLancelot',
        },
        {
          id: 'fc8d6d17-83b9-417e-adf5-6f749d3823c5',
          index: 7,
          name: 'Ze You',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'servant',
        },
        {
          id: '162ebe41-1b6e-454f-a622-847a3c3b08d4',
          index: 8,
          name: 'Yash',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'merlin',
        },
        {
          id: '90c12cf0-4880-44da-becf-634fc0650ebc',
          index: 1,
          name: 'ivy',
          features: {
            isSelected: false,
            isLeader: false,
            isSent: false,
            waitForAction: false,
          },
          role: 'goodLancelot',
        },
      ],
    },
  },
];
