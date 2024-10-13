<template>
  <div v-if="data.targetID">
    <span
      v-html="
        $t('switch.switchInfo', {
          switcher: calculateNameByID(data.switcherID),
          target: calculateNameByID(data.targetID),
        })
      "
    ></span>
    <span>&nbsp;</span>
    <template v-if="data.result">
      <span :class="data.result === 'fail' ? 'text-error' : 'text-success'"> {{ $t('inGame.' + data.result) }} </span>
    </template>
    <span v-else>???</span>
  </div>
  <div v-else>
    <b>{{ calculateNameByID(data.switcherID) }}</b> {{ $t('switch.skip') }}
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
