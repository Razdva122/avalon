<template>
  <div v-if="data.targetID">
    <b>{{ calculateNameByID(data.switcherID) }}</b> use excalibur to switch
    <b>{{ calculateNameByID(data.targetID) }}</b> action
    <template v-if="data.result">
      <span :class="data.result === 'fail' ? 'text-error' : 'text-success'"> to {{ data.result }} </span>
    </template>
  </div>
  <div v-else>
    <b>{{ calculateNameByID(data.switcherID) }}</b> decided not to use excalibur
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ISwitchResult } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<ISwitchResult>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
