<template>
  <v-dialog v-model="open" max-width="340">
    <v-card v-if="card" class="trapper-reveal pa-5 text-center">
      <h2 class="text-h6 mb-3">{{ $t('trapper.cardTitle', { player: targetName }) }}</h2>
      <Spoiler :size="{ width: '100%', height: '200px' }">
        <PlayerIcon :icon="card.result === 'fail' ? 'evil' : 'good'" class="trapper-card mx-auto mb-3" />
        <p class="font-weight-bold" :class="card.result === 'fail' ? 'text-error' : 'text-success'">
          {{ $t('inGame.' + card.result) }}
        </p>
      </Spoiler>
      <p class="mt-3 mb-4">{{ $t('trapper.private') }}</p>
      <v-btn color="primary" min-height="44" @click="open = false">{{ $t('trapper.done') }}</v-btn>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { VisualGameState, DiscardMissionCard } from '@avalon/types';
import { useStore } from '@/store';
import { privateTrapperCard } from '@/helpers/trapper-result';
import PlayerIcon from '@/components/view/information/PlayerIcon.vue';
import Spoiler from '@/components/feedback/Spoiler.vue';

const props = defineProps<{ game?: VisualGameState }>();
const store = useStore();
const open = ref(false);
const card = ref<DiscardMissionCard>();
let lastKey: string | undefined;
const targetName = computed(() => {
  const user = card.value && store.state.users[card.value.targetID];
  return user?.status === 'ready' ? user.profile.name : '…';
});
watch(
  () => [props.game, store.state.profile?.id] as const,
  ([game, viewerID]) => {
    if (lastKey && game && !lastKey.startsWith(`${game.uuid}:`)) {
      open.value = false;
      card.value = undefined;
      lastKey = undefined;
    }
    if (!viewerID || game?.stage === 'end' || (card.value && card.value.leaderID !== viewerID)) {
      open.value = false;
      card.value = undefined;
    }
    const next = privateTrapperCard(game, viewerID);
    if (!next || next.key === lastKey) return;
    lastKey = next.key;
    card.value = next.event;
    open.value = true;
  },
  { immediate: true },
);
</script>
<style scoped>
.trapper-card {
  width: 150px;
  height: 150px;
  background-size: contain;
}
</style>
