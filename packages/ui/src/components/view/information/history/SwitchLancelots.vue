<template>
  <div>
    {{ $t('lancelotsHistory.cards') }}
    <span
      v-html="
        data.switches
          .map((el, index) => {
            let str;
            if (el === null) {
              str = '?';
            } else {
              str = el ? 'switch' : 'empty';
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
  <div v-if="!data.result">
    {{ $t('roles.lancelots') }}<span class="text-success">{{ $t('lancelotsHistory.lancelotsLoyal') }}</span>
  </div>
  <div v-else>
    {{ $t('roles.lancelots') }} <span class="text-error">{{ $t('lancelotsHistory.lancelotsSwap') }}</span>
  </div>
  <div v-if="data.lancelotsIDs">
    <div>
      <span class="text-success">{{ $t('roles.goodLancelot') }}</span
      >: {{ calculateNameByID(data.lancelotsIDs.good) }}
      {{ data.result ? $t('lancelotsHistory.becameEvil') : $t('lancelotsHistory.lancelotSaveLoyalty') }}
    </div>
    <div>
      <span class="text-error">{{ $t('roles.evilLancelot') }}</span
      >: {{ calculateNameByID(data.lancelotsIDs.evil) }}
      {{ data.result ? $t('lancelotsHistory.becameGood') : $t('lancelotsHistory.lancelotSaveLoyalty') }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ISwitchLancelots } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

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
