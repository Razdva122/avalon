import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { AiBudgetSnapshot } from '@avalon/types';
import type { Ref } from 'vue';
import { socket } from '@/api/socket';
import { useStore } from '@/store';

export function useAiAccess(roomIDs: Ref<string[]> = computed(() => [])) {
  const store = useStore();
  const canManage = ref(false);
  const costs = ref<Record<string, number>>({});
  const budget = ref<AiBudgetSnapshot>();
  let version = 0;
  const clear = () => {
    version++;
    canManage.value = false;
    costs.value = {};
    budget.value = undefined;
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
      if (!access.canManage) {
        budget.value = undefined;
        costs.value = {};
        return;
      }
      const summary = await socket.timeout(5000).emitWithAck('getAiBudget');
      if (current !== version) return;
      if ('error' in summary) {
        clear();
        return;
      }
      budget.value = summary.budget;
      const ids = roomIDs.value.slice(0, 50);
      if (!ids.length) {
        costs.value = {};
        return;
      }
      const result = await socket.timeout(5000).emitWithAck('getAiRoomCosts', ids);
      if (current !== version) return;
      if ('error' in result) {
        clear();
        return;
      }
      costs.value = result.costs;
    } catch {
      if (current === version) clear();
    }
  }
  watch(
    () => [store.state.profile?.id, roomIDs.value.join(',')],
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
  return { canManage, costs, budget };
}
