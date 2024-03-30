<template>
  <div>
    <b>{{ calculateNameByID(data.validatorID) }}</b> checked <b>{{ calculateNameByID(data.inspectedID) }}</b> loyalty
    <span v-if="data.realLoyalty">
      is
      <span :class="data.realLoyalty === 'evil' ? 'text-error' : 'text-success'">
        {{ data.realLoyalty }}
      </span>
    </span>
  </div>
  <div>
    And declared his loyalty as
    <span :class="data.result === 'evil' ? 'text-error' : 'text-success'"> {{ data.result }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ICheckLoyalty } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<ICheckLoyalty>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
