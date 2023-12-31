import type { InjectionKey, Ref } from 'vue';
import type { TAvailableRoom } from '@avalon/types';

export type TAvailableRoomState = Ref<TAvailableRoom>;
export const roomStateKey = Symbol() as InjectionKey<TAvailableRoomState>;
