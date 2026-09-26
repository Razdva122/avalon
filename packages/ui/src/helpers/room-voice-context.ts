import type { InjectionKey, ShallowRef } from 'vue';
import type { createRoomVoice } from './composables/useRoomVoice';

// One room owns one client; the panel publishes its state for table indicators.
export const roomVoiceKey: InjectionKey<ShallowRef<ReturnType<typeof createRoomVoice> | undefined>> =
  Symbol('roomVoice');
