<template>
  <div>
    {{ calculateNameByID(data.assassinID) }} assassinate
    {{ data.killedIDs.map(calculateNameByID).join(', ') }}
  </div>
  <div>
    {{ data.killedIDs.map(calculateNameByID).join(', ') }}
    {{ data.result === 'hit' ? 'is' : 'is not' }} {{ data.assassinateType }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { IHistoryAssassinate } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<IHistoryAssassinate>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
