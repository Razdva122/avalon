<template>
  <div>
    <div>
      {{ $t('preVote.title') }}
    </div>
    <div>
      {{ $t('vote.approve') }} {{ data.votes.filter((vote) => vote.value === 'approve').length }} ·
      {{ $t('vote.reject') }} {{ data.votes.filter((vote) => vote.value === 'reject').length }}
    </div>
    <details class="vote-details">
      <summary>{{ $t('history.playerVotes') }}</summary>
      <div class="voter-groups">
        <div
          v-for="choice in ['approve', 'reject'] as const"
          :key="choice"
          class="voter-group"
          :class="`voter-group--${choice}`"
        >
          <div class="voter-heading">
            <span aria-hidden="true">{{ choice === 'approve' ? '✓' : '×' }}</span> {{ $t(`vote.${choice}`) }}
            {{ data.votes.filter((vote) => vote.value === choice).length }}
          </div>
          <ul class="voter-chips" :aria-label="$t(`vote.${choice}`)">
            <li v-for="vote in data.votes.filter((vote) => vote.value === choice)" :key="vote.playerID">
              {{ playerNames[vote.playerID] }}
            </li>
          </ul>
        </div>
      </div>
    </details>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PreVote } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<PreVote>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss">
summary {
  min-height: 44px;
  padding: 10px 0;
  cursor: pointer;
  color: rgb(var(--v-theme-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}
.voter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  > li {
    max-width: 100%;
    padding: 4px 8px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 6px;
    background: rgba(var(--v-theme-on-surface), 0.035);
    overflow-wrap: anywhere;
  }
}
@import './voter-groups.scss';
</style>
