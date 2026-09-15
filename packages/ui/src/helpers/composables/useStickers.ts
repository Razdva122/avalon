import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { store } from '@/store';
import { socket } from '@/api/socket';
import type { StickerCollection } from '@avalon/types';

export function useStickers() {
  const collection = ref<StickerCollection>();
  const loading = ref(false);
  const error = ref('');
  const busy = ref(false);
  let request = 0;
  let disposed = false;
  const userID = computed(() => store.state.profile?.id);
  const load = async () => {
    const version = ++request;
    if (!userID.value) {
      collection.value = undefined;
      loading.value = false;
      error.value = '';
      return;
    }
    loading.value = true;
    try {
      const result = await socket.timeout(10000).emitWithAck('getMyStickers');
      if (disposed || version !== request) return;
      if ('error' in result) error.value = result.error;
      else {
        collection.value = result;
        error.value = '';
      }
    } catch {
      if (!disposed && version === request) error.value = 'failed';
    } finally {
      if (version === request) loading.value = false;
    }
  };
  const save = async (favorites: string[], hideOnBoard = collection.value?.hideOnBoard || false) => {
    if (busy.value || !userID.value) return;
    const owner = userID.value;
    request++;
    busy.value = true;
    try {
      const result = await socket.timeout(10000).emitWithAck('updateStickerPreferences', favorites, hideOnBoard);
      if (disposed || userID.value !== owner) return;
      request++;
      loading.value = false;
      if ('error' in result) error.value = result.error;
      else {
        collection.value = result;
        error.value = '';
      }
    } catch {
      error.value = 'failed';
    } finally {
      busy.value = false;
    }
  };
  const markSeen = async (ids: string[]) => {
    const owner = userID.value;
    if (!owner) return;
    try {
      const result = await socket.timeout(10000).emitWithAck('markStickersSeen', ids);
      if (!disposed && owner === userID.value && result === true && collection.value)
        collection.value.stickers.forEach((s) => {
          if (ids.includes(s.id)) s.isNew = false;
        });
    } catch {
      /* New badges remain available on retry. */
    }
  };
  watch(userID, () => {
    collection.value = undefined;
    void load();
  });
  onMounted(() => {
    void load();
    socket.on('stickersUpdated', load);
    socket.on('achievementUnlocked', load);
    socket.on('connect', load);
  });
  onUnmounted(() => {
    disposed = true;
    request++;
    socket.off('stickersUpdated', load);
    socket.off('achievementUnlocked', load);
    socket.off('connect', load);
  });
  return { collection, loading, error, busy, load, save, markSeen };
}
