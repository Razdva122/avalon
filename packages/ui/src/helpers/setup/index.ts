import { useStore } from '@/store';
import { computed } from 'vue';

export function useUserProfile(uuid: string) {
  const store = useStore();

  store.dispatch('getUserPublicProfile', { uuid });

  const userState = computed(() => {
    return store.state.users[uuid];
  });

  return {
    userState,
  };
}
