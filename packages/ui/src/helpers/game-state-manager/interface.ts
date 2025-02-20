import type { Ref } from 'vue';
import type { VisualGameState, TStartedRoomState, TRoomState } from '@avalon/types';

export type TPageRoomStateRef = Ref<TPageRoomState>;

export type TPageRoomState = Exclude<TRoomState, TStartedRoomState> | TStartedPageRoomState;

export type TStartedPageRoomState = TStartedRoomState & {
  pointer: number;
  gameStates: VisualGameState[];
};
