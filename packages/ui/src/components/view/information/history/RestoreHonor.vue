<template>
  <div>
    <span
      v-html="
        $t('restoreHonor.transfer', {
          cardName: $t('cardsInfo.' + data.cardName),
          prevOwnerName: calculateNameByID(data.prevOwnerID),
          newOwnerName: calculateNameByID(data.newOwnerID),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { RestoreHonor } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<RestoreHonor>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
