<template>
  <div>
    Cards:
    <span
      v-html="
        data.switches
          .map((el, index) => {
            let str;
            if (el === null) {
              str = 'unknown';
            } else {
              str = el ? 'switch' : 'stay';
            }

            if (index === data.pointer) {
              str = `<b>${str}</b>`;
            }

            return str;
          })
          .join(', ')
      "
    ></span>
  </div>
  <div v-if="!data.result">The Lancelots <span class="text-success">remained loyalty</span></div>
  <div v-else>The Lancelots <span class="text-error">have changed loyalty</span></div>
  <div v-if="data.lancelotsIDs">
    <div>
      <span class="text-success">Good lancelot</span>: {{ calculateNameByID(data.lancelotsIDs.good) }}
      {{ data.result ? 'became evil' : 'remain loyal' }}
    </div>
    <div>
      <span class="text-error">Evil lancelot</span>: {{ calculateNameByID(data.lancelotsIDs.evil) }}
      {{ data.result ? 'became good' : 'remain loyal' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ISwitchLancelots } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/game/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<ISwitchLancelots>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
