import { computed, onScopeDispose, ref, watch } from 'vue';
import { createSharedComposable } from '@vueuse/core';
import { store } from '@/store';
import { socket } from '@/api/socket';
import type { StickerCollection } from '@avalon/types';
import { STICKERS } from '@avalon/types/user/stickers';

export const useStickers = createSharedComposable(() => {
  const collection = ref<StickerCollection>();
  const loading = ref(false);
  const error = ref('');
  const busy = ref(false);
  let request = 0;
  let account = 0;
  let disposed = false;
  const unlocked = ref<string[]>([]);
  let knownAvailable: Set<string> | undefined;
  let pendingRewards = false;
  const applyCollection = (result: StickerCollection) => {
    const available = result.stickers.filter((s) => s.available).map((s) => s.id);
    if (pendingRewards && knownAvailable) {
      const previous = knownAvailable;
      const gained = available.filter((id) => {
        const sticker = STICKERS.find((s) => s.id === id);
        return !previous.has(id) && !!(sticker?.games || sticker?.achievement);
      });
      if (gained.length) unlocked.value = gained;
    }
    pendingRewards = false;
    knownAvailable = new Set(available);
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
    const version = ++request;
    loading.value = false;
    busy.value = true;
    try {
      const result = await socket.timeout(10000).emitWithAck('updateStickerPreferences', favorites, hideOnBoard);
      if (disposed || account !== owner) return false;
      const refreshed = version !== request;
      if ('error' in result) error.value = result.error;
      else {
        request++;
        loading.value = false;
        if (refreshed) {
          // A save response can predate a game update. Preserve the reward baseline.
          if (collection.value)
            collection.value = { ...collection.value, favorites: result.favorites, hideOnBoard: result.hideOnBoard };
          void load();
        } else applyCollection(result);
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
  watch(
    userID,
    () => {
      account++;
      knownAvailable = undefined;
      pendingRewards = false;
      unlocked.value = [];
      collection.value = undefined;
      error.value = '';
      busy.value = false;
      void load();
    },
    { immediate: true, flush: 'sync' },
  );
  const refreshRewards = () => {
    pendingRewards = !!knownAvailable;
    void load();
  };
  const reconnect = () => {
    knownAvailable = undefined;
    pendingRewards = false;
    unlocked.value = [];
    void load();
  };
  socket.on('stickersUpdated', refreshRewards);
  socket.on('achievementUnlocked', refreshRewards);
  socket.on('connect', reconnect);
  onScopeDispose(() => {
    disposed = true;
    request++;
    socket.off('stickersUpdated', refreshRewards);
    socket.off('achievementUnlocked', refreshRewards);
    socket.off('connect', reconnect);
  });
  return { collection, loading, error, busy, unlocked, load, save };
});
