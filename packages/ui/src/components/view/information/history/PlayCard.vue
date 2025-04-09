<template>
  <div>
    <span
      v-html="
        $t('playCard.history', {
          cardName: $t('cardsInfo.' + data.cardName),
          cardOwner: calculateNameByID(data.ownerID),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PlayCard } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<PlayCard>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
