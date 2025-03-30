import { computed, ComputedRef } from 'vue';
import type { VisualGameState } from '@avalon/types';
import { useStore } from '@/store';

export function useGamePlayerState(game: ComputedRef<VisualGameState>) {
  const store = useStore();

  const player = computed(() => {
    return game.value.players.find((player) => player.id === store.state.profile?.id);
  });

  const isUserLeader = computed(() => {
    return player.value?.features.isLeader;
  });

  const isPlayerActive = computed(() => {
    return player.value?.features.waitForAction;
  });

  const isZeroPlayerSelected = computed(() => {
    return game.value.players.filter((player) => player.features.isSelected).length === 0;
  });

  const isSinglePlayerSelected = computed(() => {
    return game.value.players.filter((player) => player.features.isSelected).length === 1;
  });

  return {
    player,
    isUserLeader,
    isPlayerActive,
    isZeroPlayerSelected,
    isSinglePlayerSelected,
  };
}
