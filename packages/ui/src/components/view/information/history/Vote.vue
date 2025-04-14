<template>
  <div>
    <span v-if="data.forced" class="text-info"> {{ $t('vote.forcedVote') }} </span>
    <span v-else :class="data.result === 'reject' ? 'text-error' : 'text-success'">
      {{ $t('vote.voteIndex', { index: data.index + 1 }) }}
    </span>
    <span>
      {{ ' ' + $t('vote.teamSelected') + ' ' }}<b>{{ playerNames[data.leaderID] }}</b>
    </span>
  </div>
  <div>
    {{ $t('vote.team') }}
    {{
      data.team
        .map((el) => {
          const name = playerNames[el.id];
          return el.excalibur ? name + $t('vote.excaliburOwner') : name;
        })
        .join(', ')
    }}
  </div>
  <template v-if="!data.forced">
    <div>
      {{ $t('vote.approve') }}
      <span class="text-success">
        {{ historyElText(data, 'approve') }}
      </span>
    </div>
    <div>
      {{ $t('vote.reject') }}
      <span class="text-error">
        {{ historyElText(data, 'reject') }}
      </span>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { THistoryVote } from '@avalon/types';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<THistoryVote>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<Record<string, string>>,
    },
  },
  methods: {
    historyElText(element: THistoryVote, type: 'reject' | 'approve') {
      if (element.anonymous) {
        return element.votes[type];
      }

      return element.votes
        .filter((el) => el.value === type)
        .map((el) => this.playerNames[el.playerID])
        .join(', ');
    },
  },
});
</script>

<style scoped lang="scss"></style>
