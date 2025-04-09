<template>
  <div>
    <span
      v-html="
        $t('weFoundYou.history', {
          cardName: $t('cardsInfo.weFoundYou'),
          cardOwner: calculateNameByID(data.ownerID),
          selectedPlayer: calculateNameByID(data.selectedPlayerID),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { WeFoundYou } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<WeFoundYou>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
