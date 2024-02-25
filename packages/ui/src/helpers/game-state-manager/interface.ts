import type { Ref } from 'vue';
import type { IVisualGameState, TStartedRoomState, TRoomState } from '@avalon/types';

export type TPageRoomStateRef = Ref<TPageRoomState>;

export type TPageRoomState = Exclude<TRoomState, TStartedRoomState> | TStartedPageRoomState;

export type TStartedPageRoomState = Omit<TStartedRoomState, 'game'> & {
  pointer: number;
  gameStates: IVisualGameState[];
};
