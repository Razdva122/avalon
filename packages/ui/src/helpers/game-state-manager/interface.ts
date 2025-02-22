import type { Ref } from 'vue';
import type { VisualGameState, StartedRoomState, TRoomState } from '@avalon/types';

export type TPageRoomStateRef = Ref<TPageRoomState>;

export type TPageRoomState = Exclude<TRoomState, StartedRoomState> | TStartedPageRoomState;

export type TStartedPageRoomState = StartedRoomState & {
  pointer: number;
  gameStates: VisualGameState[];
};
