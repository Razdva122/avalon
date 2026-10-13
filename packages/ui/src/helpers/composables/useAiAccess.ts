import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { AiBotMode, ClientToServerEvents, CodexModelOption } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';

type AiAccess = Parameters<Parameters<ClientToServerEvents['getAiRoomAccess']>[0]>[0];
let latestAccess: { userID: string; checkedAt: number; value: AiAccess } | undefined;

export function useAiAccess() {
  const store = useStore();
  const canManage = ref(false);
  const canPlay = ref(false);
  const canPlayLargeTables = ref(false);
  const botsBusy = ref(false);
  const accessStatus = ref<'loading' | 'ready' | 'error'>('loading');
  const botModes = ref({ smart: false, regular: false, beginner: false });
  const botModeAvailableAt = ref<Partial<Record<AiBotMode, number>>>({});
  const now = ref(Date.now());
  const botWaitHours = computed(() => {
    const hours: Partial<Record<AiBotMode, number>> = {};
    if (botsBusy.value) return hours;
    for (const difficulty of ['smart', 'regular', 'beginner'] as const) {
      const reset = botModeAvailableAt.value[difficulty];
      if (!botModes.value[difficulty] && reset && reset > now.value)
        hours[difficulty] = Math.ceil((reset - now.value) / 360000) / 10;
    }
    return hours;
  });
  const ownRoomID = ref<string>();
  const models = ref<{ id: string; label: string }[]>([]);
  const defaultModel = ref('');
  const codexModels = ref<CodexModelOption[]>([]);
  const activeRoomID = ref<string>();
  let version = 0;
  let accessLoading = false;
  let catalogVersion = 0;
  let catalogLoading = false;
  const clear = () => {
    version++;
    accessLoading = false;
    accessStatus.value = 'ready';
    catalogVersion++;
    canManage.value = false;
    canPlay.value = false;
    canPlayLargeTables.value = false;
    botsBusy.value = false;
    botModes.value = { smart: false, regular: false, beginner: false };
    botModeAvailableAt.value = {};
    ownRoomID.value = undefined;
    models.value = [];
    codexModels.value = [];
    defaultModel.value = '';
    activeRoomID.value = undefined;
  };
  function applyAccess(access: AiAccess) {
    canManage.value = access.canManage;
    canPlay.value = access.canPlay === true;
    canPlayLargeTables.value = access.canPlay === true && access.canPlayLargeTables === true;
    botsBusy.value = access.canPlay === true && access.botsBusy === true;
    accessStatus.value = 'ready';
    botModes.value = access.canPlay
      ? access.botModes || { smart: false, regular: false, beginner: false }
      : { smart: false, regular: false, beginner: false };
    botModeAvailableAt.value = access.canPlay ? access.botModeAvailableAt || {} : {};
    ownRoomID.value = access.canPlay ? access.ownRoomID : undefined;
    models.value = access.canManage ? access.models || [] : [];
    defaultModel.value = access.canManage ? access.defaultModel || '' : '';
    activeRoomID.value = access.canManage ? access.roomID : undefined;
  }
  async function refresh() {
    now.value = Date.now();
    if (accessLoading) return;
    const current = ++version;
    if (!store.state.profile?.id) {
      clear();
      return;
    }
    accessLoading = true;
    try {
      const access = await socket.timeout(30000).emitWithAck('getAiRoomAccess');
      if (current !== version) return;
      latestAccess = { userID: store.state.profile!.id, checkedAt: Date.now(), value: access };
      applyAccess(access);
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
      if (current === version) {
        latestAccess = undefined;
        clear();
        accessStatus.value = 'error';
      }
    } finally {
      if (current === version) accessLoading = false;
    }
  }
  watch(
    () => store.state.profile?.id,
    (userID) => {
      clear();
      if (latestAccess?.userID !== userID) latestAccess = undefined;
      if (userID) {
        accessStatus.value = 'loading';
        if (latestAccess && Date.now() - latestAccess.checkedAt < 60000) applyAccess(latestAccess.value);
      }
      void refresh();
    },
    { immediate: true },
  );
  socket.on('connect', refresh);
  const disconnected = () => {
    latestAccess = undefined;
    clear();
    accessStatus.value = 'error';
  };
  socket.on('disconnect', disconnected);
  const timer = setInterval(refresh, 10000);
  onBeforeUnmount(() => {
    clearInterval(timer);
    clear();
    socket.off('connect', refresh);
    socket.off('disconnect', disconnected);
  });
  return {
    canManage,
    canPlay,
    canPlayLargeTables,
    botsBusy,
    accessStatus,
    botModes,
    botModeAvailableAt,
    botWaitHours,
    ownRoomID,
    models,
    codexModels,
    defaultModel,
    activeRoomID,
    refresh,
  };
}
