import { computed, onScopeDispose, ref, watch } from 'vue';
import { createSharedComposable } from '@vueuse/core';
import { store } from '@/store';
import { socket } from '@/api/socket';
import type { StickerCollection } from '@avalon/types';

export const useStickers = createSharedComposable(() => {
  const collection = ref<StickerCollection>();
  const loading = ref(false);
  const error = ref('');
  const busy = ref(false);
  let request = 0;
  let account = 0;
  let disposed = false;
  const seen = new Set<string>();
  const applyCollection = (result: StickerCollection) => {
    result.stickers.forEach((s) => {
      if (seen.has(s.id)) s.isNew = false;
    });
    collection.value = result;
  };
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
        applyCollection(result);
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
    const owner = account;
    request++;
    loading.value = false;
    busy.value = true;
    try {
      const result = await socket.timeout(10000).emitWithAck('updateStickerPreferences', favorites, hideOnBoard);
      if (disposed || account !== owner) return false;
      request++;
      loading.value = false;
      if ('error' in result) error.value = result.error;
      else {
        applyCollection(result);
        error.value = '';
        return true;
      }
    } catch {
      if (!disposed && account === owner) error.value = 'failed';
    } finally {
      if (account === owner) busy.value = false;
    }
    return false;
  };
  const markSeen = async (ids: string[]) => {
    const owner = account;
    if (!userID.value) return false;
    try {
      // The endpoint accepts up to twelve IDs per request.
      for (let offset = 0; offset < ids.length; offset += 12) {
        const batch = ids.slice(offset, offset + 12);
        const result = await socket.timeout(10000).emitWithAck('markStickersSeen', batch);
        if (disposed || owner !== account || result !== true) return false;
        batch.forEach((id) => seen.add(id));
        if (collection.value)
          collection.value.stickers.forEach((s) => {
            if (batch.includes(s.id)) s.isNew = false;
          });
      }
      return true;
    } catch {
      /* New badges remain available on retry. */
      return false;
    }
  };
  watch(
    userID,
    () => {
      account++;
      seen.clear();
      collection.value = undefined;
      error.value = '';
      busy.value = false;
      void load();
    },
    { immediate: true, flush: 'sync' },
  );
  socket.on('stickersUpdated', load);
  socket.on('achievementUnlocked', load);
  socket.on('connect', load);
  onScopeDispose(() => {
    disposed = true;
    request++;
    socket.off('stickersUpdated', load);
    socket.off('achievementUnlocked', load);
    socket.off('connect', load);
  });
  const newCount = computed(() => collection.value?.stickers.filter((s) => s.available && s.isNew).length || 0);
  return { collection, loading, error, busy, newCount, load, save, markSeen };
});
