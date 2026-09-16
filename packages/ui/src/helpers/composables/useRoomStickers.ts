import { InjectionKey, Ref, onUnmounted, provide, reactive, watch } from 'vue';
import type { StickerMessage, TRoomState } from '@avalon/types';
import { STICKERS, STICKER_DURATION_MS } from '@avalon/types/user/stickers';
import { socket } from '@/api/socket';
export const stickerReactionsKey: InjectionKey<Record<string, StickerMessage>> = Symbol('stickerReactions');
export function useRoomStickers(roomID: () => string, state: Ref<TRoomState>, hideOnBoard: () => boolean) {
  const reactions = reactive<Record<string, StickerMessage>>({});
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const seen = new Set<string>();
  provide(stickerReactionsKey, reactions);
  const clear = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    Object.keys(reactions).forEach((id) => delete reactions[id]);
    seen.clear();
  };
  const receive = (message: StickerMessage) => {
    if (
      message.roomID !== roomID() ||
      !state.value ||
      seen.has(message.id) ||
      !STICKERS.some((s) => s.id === message.stickerID)
    )
      return;
    seen.add(message.id);
    if (seen.size > 200) seen.delete(seen.values().next().value!);
    if (!state.value.chat.some((m) => m.id === message.id))
      state.value.chat = [
        ...state.value.chat,
        {
          id: message.id,
          kind: 'sticker',
          stickerID: message.stickerID,
          message: message.stickerID,
          userID: message.userID,
          timestamp: message.timestamp,
        },
      ];
    if (!message.showOnBoard || hideOnBoard()) return;
    if (timers.has(message.userID)) clearTimeout(timers.get(message.userID));
    reactions[message.userID] = message;
    timers.set(
      message.userID,
      setTimeout(() => {
        delete reactions[message.userID];
        timers.delete(message.userID);
      }, STICKER_DURATION_MS),
    );
  };
  socket.on('stickerSent', receive);
  socket.on('disconnect', clear);
  watch(roomID, clear);
  watch(hideOnBoard, (value) => {
    if (value) clear();
  });
  onUnmounted(() => {
    clear();
    socket.off('stickerSent', receive);
    socket.off('disconnect', clear);
  });
}
