<template>
  <div class="mission">
    <div>
      <span :class="data.result === 'fail' ? 'text-error' : 'text-success'"> {{ data.index + 1 }} mission </span>
      <span> / fails {{ data.fails }} </span>
    </div>
    <div v-if="data.actions">
      Team:
      <template v-for="(el, index) in data.actions">
        <span :class="{ fail: 'text-error', success: 'text-success' }[(el as IActionWithResult).value]">
          {{ calculateNameByID(el.playerID) }}
        </span>
        <span>
          {{ index !== data.actions.length - 1 ? ', ' : '' }}
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { IHistoryMission, IActionWithResult } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<IHistoryMission>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss">
.mission {
  font-size: x-large;
}
</style>
