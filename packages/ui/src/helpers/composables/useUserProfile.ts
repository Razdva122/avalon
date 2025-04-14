import { useStore } from '@/store';
import { computed, Ref, toValue, watchEffect } from 'vue';

/**
 * Composable to get user profile data
 * @param uuid - User UUID or ref to UUID
 * @returns Store reference and computed user data that updates when UUID changes
 */
export function useUserProfile(uuid: string | Ref<string>) {
  const store = useStore();

  // Watch for UUID changes and dispatch action when it changes
  watchEffect(() => {
    const currentUuid = toValue(uuid);
    store.dispatch('getUserPublicProfile', { uuid: currentUuid });
  });

  /**
   * Get user state for the specified UUID
   */
  const userState = computed(() => {
    const currentUuid = toValue(uuid);
    return store.state.users[currentUuid];
  });

  /**
   * Get user name, with fallback for loading state
   */
  const userName = computed(() => {
    return userState.value.status === 'loading' ? '???' : userState.value.profile.name;
  });

  return {
    userState,
    userName,
  };
}
