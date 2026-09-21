import type { InjectionKey, Ref } from 'vue';
export const roomChatKey: InjectionKey<{
  open: Ref<boolean>;
  roomID: () => string;
}> = Symbol('roomChat');
