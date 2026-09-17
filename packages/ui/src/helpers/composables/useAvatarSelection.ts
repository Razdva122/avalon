import { ref } from 'vue';
import type { IAvatarInfo } from '@avalon/types';

interface AvatarSelectionOptions {
  load: () => Promise<IAvatarInfo[]>;
  save: (id: string) => Promise<true | { error: string }>;
  current: () => string | undefined;
}

/** Keeps asynchronous responses scoped to the dialog session that requested them. */
export function useAvatarSelection({ load, save, current }: AvatarSelectionOptions) {
  const avatars = ref<IAvatarInfo[]>([]);
  const inspected = ref<IAvatarInfo | null>(null);
  const loading = ref(false);
  const loadFailed = ref(false);
  const savingId = ref<string | null>(null);
  const saveFailed = ref(false);
  const saved = ref(false);
  let session = 0;

  const open = async () => {
    const requestSession = ++session;
    if (!savingId.value) inspected.value = null;
    saveFailed.value = false;
    saved.value = false;
    loadFailed.value = false;
    avatars.value = [];
    loading.value = true;
    try {
      const result = await load();
      if (requestSession === session) {
        avatars.value = [...result].sort((a, b) => Number(b.available) - Number(a.available));
      }
    } catch {
      if (requestSession === session) loadFailed.value = true;
    } finally {
      if (requestSession === session) loading.value = false;
    }
  };

  const close = () => {
    session++;
    loading.value = false;
  };

  const select = async (avatar: IAvatarInfo) => {
    if (savingId.value) return;
    inspected.value = avatar;
    saveFailed.value = false;
    saved.value = false;
    if (!avatar.available || avatar.id === current()) return;

    savingId.value = avatar.id;
    try {
      const result = await save(avatar.id);
      saved.value = result === true;
      saveFailed.value = result !== true;
    } catch {
      saveFailed.value = true;
    } finally {
      savingId.value = null;
    }
  };

  return { avatars, inspected, loading, loadFailed, savingId, saveFailed, saved, open, close, select };
}
