<template>
  <div>
    <span
      v-html="
        $t('checkLoyalty.checkInfo', {
          ladyOwner: calculateNameByID(data.validatorID),
          ladyTarget: calculateNameByID(data.inspectedID),
        })
      "
    ></span>
    <span v-if="data.realLoyalty">
      -
      <span :class="data.realLoyalty === 'evil' ? 'text-error' : 'text-success'">
        {{ $t('game.' + data.realLoyalty) }}
      </span>
    </span>
  </div>
  <div>
    {{ $t('checkLoyalty.declareInfo') }}
    <span :class="data.result === 'evil' ? 'text-error' : 'text-success'"> {{ $t('game.' + data.result) }}</span>
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
