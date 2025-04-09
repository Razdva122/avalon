<template>
  <div>
    <span
      v-html="
        $t('revealLoyalty.revealInfo', {
          revealer: calculateNameByID(data.revealerID),
          target: calculateNameByID(data.targetID),
        })
      "
    ></span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { RevealLoyalty } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<RevealLoyalty>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
