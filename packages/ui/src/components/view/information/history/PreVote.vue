<template>
  <div>
    <div>
      {{ $t('preVote.title') }}
    </div>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PreVote } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<PreVote>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
  methods: {
    historyElText(element: PreVote, type: 'reject' | 'approve') {
      return element.votes
        .filter((el) => el.value === type)
        .map((el) => this.calculateNameByID(el.playerID))
        .join(', ');
    },
  },
});
</script>

<style scoped lang="scss"></style>
