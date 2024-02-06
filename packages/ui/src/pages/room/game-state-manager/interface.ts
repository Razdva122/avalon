import type { Ref } from 'vue';
import type { IVisualGameState, TStartedRoomState, TRoomState, TUnavailableState } from '@avalon/types';

export type TPageRoomStateRef = Ref<TPageRoomState>;
export type TAvailableRoomStateRef = Ref<Exclude<TPageRoomState, TUnavailableState>>;

export type TPageRoomState =
  | Exclude<TRoomState, TStartedRoomState>
  | (Omit<TStartedRoomState, 'game'> & {
      pointer: number;
      gameStates: IVisualGameState[];
    });