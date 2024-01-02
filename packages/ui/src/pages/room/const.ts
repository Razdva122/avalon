import type { InjectionKey, Ref } from 'vue';
import type { TAvailableRoom } from '@avalon/types';

export const stages = {
  initialization: 'The game is being initialized...',
  selectTeam: 'The leader chooses the team.',
  votingForTeam: 'The round table votes for the selected team.',
  onMission: 'The selected team is on a mission.',
  selectMerlin: "Mordred's minions are trying to figure out Merlin.",
  end: 'The game is over.',
  created: 'The game has been created, we are waiting for the players to connect',
  locked: 'The game is locked, we are waiting for the start of the game',
  started: 'The game has started',
  unavailable: 'The game in unavailable',
} as const;

export type TAvailableRoomState = Ref<TAvailableRoom>;
export const roomStateKey = Symbol() as InjectionKey<TAvailableRoomState>;
