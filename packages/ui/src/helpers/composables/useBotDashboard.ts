import { onBeforeUnmount, ref, watch } from 'vue';
import type { AiBotDashboard, BotQuotaThresholds } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';

export function useBotDashboard() {
  const store = useStore();
  const data = ref<AiBotDashboard | null>(null);
  const draftThresholds = ref<BotQuotaThresholds | null>(null);
  const loading = ref(false);
  const denied = ref(false);
  const error = ref(false);
  const saving = ref(false);
  const saveError = ref(false);
  const saved = ref(false);
  let version = 0;
  let stopped = false;

  function clear() {
    version++;
    data.value = null;
    draftThresholds.value = null;
    loading.value = false;
    saving.value = false;
    saveError.value = false;
    saved.value = false;
  }
  async function refresh() {
    if (stopped || loading.value || saving.value) return;
    if (!store.state.profile?.id) {
      clear();
      denied.value = true;
      return;
    }
    const current = ++version;
    loading.value = true;
    try {
      const result = await socket.timeout(30000).emitWithAck('getAiBotDashboard');
      if (stopped || current !== version) return;
      if ('error' in result) {
        denied.value = result.error === 'AI room access denied';
        error.value = !denied.value;
        if (denied.value) {
          data.value = null;
          draftThresholds.value = null;
        }
      } else {
        data.value = result;
        denied.value = false;
        error.value = false;
      }
    } catch {
      if (!stopped && current === version) error.value = true;
    } finally {
      if (current === version) loading.value = false;
    }
  }
  async function saveThresholds(thresholds: BotQuotaThresholds): Promise<boolean> {
    if (stopped || saving.value || loading.value || !data.value || denied.value) return false;
    const current = version;
    const submitted = JSON.parse(JSON.stringify(thresholds)) as BotQuotaThresholds;
    saving.value = true;
    saveError.value = false;
    saved.value = false;
    try {
      const result = await socket.timeout(15000).emitWithAck('setAiBotQuotaThresholds', submitted);
      if (stopped || current !== version) return false;
      if ('error' in result) {
        if (result.error === 'AI room access denied') {
          clear();
          denied.value = true;
        } else saveError.value = true;
        return false;
      }
      data.value = { ...data.value!, thresholds: submitted };
      saved.value = true;
      return true;
    } catch {
      if (!stopped && current === version) saveError.value = true;
      return false;
    } finally {
      if (current === version) saving.value = false;
    }
  }
  const unwatch = watch(
    () => [store.state.profile?.id, store.state.profile?.token],
    () => {
      clear();
      denied.value = false;
      error.value = false;
      void refresh();
    },
    { immediate: true },
  );
  const disconnected = () => {
    const draft = draftThresholds.value;
    clear();
    // Retain edits in memory until this same session is authorized again.
    draftThresholds.value = draft;
    error.value = true;
  };
  socket.on('connect', refresh);
  socket.on('disconnect', disconnected);
  const timer = setInterval(() => {
    if (!document.hidden && !denied.value) void refresh();
  }, 15000);
  onBeforeUnmount(() => {
    stopped = true;
    clear();
    unwatch();
    clearInterval(timer);
    socket.off('connect', refresh);
    socket.off('disconnect', disconnected);
  });
  return { data, draftThresholds, loading, denied, error, refresh, saving, saveError, saved, saveThresholds };
}
