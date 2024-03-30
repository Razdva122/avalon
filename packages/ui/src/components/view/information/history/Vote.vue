<template>
  <div>
    <span v-if="data.forced" class="text-info"> Forced vote </span>
    <span v-else :class="data.result === 'reject' ? 'text-error' : 'text-success'"> {{ data.index + 1 }} vote </span>
    <span>
      team selected by <b>{{ calculateNameByID(data.leaderID) }}</b>
    </span>
  </div>
  <div>
    Team:
    {{
      data.team
        .map((el) => {
          const name = calculateNameByID(el.id);
          return el.excalibur ? name + '(Excalibur)' : name;
        })
        .join(', ')
    }}
  </div>
  <template v-if="!data.forced">
    <div>
      Approve:
      <span class="text-success">
        {{ historyElText(data, 'approve') }}
      </span>
    </div>
    <div>
      Reject:
      <span class="text-error">
        {{ historyElText(data, 'reject') }}
      </span>
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { THistoryVote } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<THistoryVote>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
  methods: {
    historyElText(element: THistoryVote, type: 'reject' | 'approve') {
      if (element.anonymous) {
        return element.votes[type];
      }

      return element.votes
        .filter((el) => el.value === type)
        .map((el) => this.calculateNameByID(el.playerID))
        .join(', ');
    },
  },
});
</script>

<style scoped lang="scss"></style>
