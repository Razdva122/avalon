<template>
  <div>
    <i18n-t keypath="trapper.history" tag="span" scope="global">
      <template #leader
        ><b>{{ playerNames[data.leaderID] }}</b></template
      >
      <template #target
        ><b>{{ playerNames[data.targetID] }}</b></template
      >
    </i18n-t>
    <span v-if="data.result" :class="data.result === 'fail' ? 'text-error' : 'text-success'">
      · {{ $t('inGame.' + data.result) }}</span
    >
  </div>
</template>
<script setup lang="ts">
import type { DiscardMissionCard } from '@avalon/types';
defineProps<{ data: DiscardMissionCard; playerNames: Record<string, string> }>();
</script>
