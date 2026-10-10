import { onBeforeUnmount, ref, watch } from 'vue';
import type { CodexModelOption } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';

export function useAiAccess() {
  const store = useStore();
  const canManage = ref(false);
  const models = ref<{ id: string; label: string }[]>([]);
  const defaultModel = ref('');
  const codexModels = ref<CodexModelOption[]>([]);
  const activeRoomID = ref<string>();
  let version = 0;
  let catalogVersion = 0;
  let catalogLoading = false;
  const clear = () => {
    version++;
    catalogVersion++;
    canManage.value = false;
    models.value = [];
    codexModels.value = [];
    defaultModel.value = '';
    activeRoomID.value = undefined;
  };
  async function refresh() {
    const current = ++version;
    if (!store.state.profile?.id) {
      clear();
      return;
    }
    try {
      const access = await socket.timeout(5000).emitWithAck('getAiRoomAccess');
      if (current !== version) return;
      canManage.value = access.canManage;
      models.value = access.canManage ? access.models || [] : [];
      defaultModel.value = access.canManage ? access.defaultModel || '' : '';
      activeRoomID.value = access.canManage ? access.roomID : undefined;
      if (!access.canManage) {
        codexModels.value = [];
        catalogVersion++;
        return;
      }
      if (models.value.some((model) => model.id === 'codex-chatgpt') && !catalogLoading) {
        const generation = catalogVersion;
        catalogLoading = true;
        void (async () => {
          try {
            const result = await socket.timeout(30000).emitWithAck('getAiCodexModels');
            if (generation === catalogVersion)
              codexModels.value =
                'error' in result
                  ? []
                  : result.models.filter((model: CodexModelOption) => !/^gpt-5(?:[.-]|$)/i.test(model.id));
          } catch {
            if (generation === catalogVersion) codexModels.value = [];
          } finally {
            catalogLoading = false;
          }
        })();
      }
    } catch {
      if (current === version) clear();
    }
  }
  watch(
    () => store.state.profile?.id,
    () => {
      clear();
      void refresh();
    },
    { immediate: true },
  );
  socket.on('connect', refresh);
  socket.on('disconnect', clear);
  const timer = setInterval(refresh, 10000);
  onBeforeUnmount(() => {
    clearInterval(timer);
    clear();
    socket.off('connect', refresh);
    socket.off('disconnect', clear);
  });
  return { canManage, models, codexModels, defaultModel, activeRoomID, refresh };
}
