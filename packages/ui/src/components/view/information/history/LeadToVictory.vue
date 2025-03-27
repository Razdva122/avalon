<template>
  <div>
    <span
      v-html="
        $t('leadToVictory.history', {
          cardName: $t('cardsInfo.leadToVictory'),
          prevLeaderName: calculateNameByID(data.prevLeaderID),
          cardOwner: calculateNameByID(data.ownerID),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { LeadToVictory } from '@avalon/types';
import type { TCalculateNameByID } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<LeadToVictory>,
    },
    calculateNameByID: {
      required: true,
      type: Function as PropType<TCalculateNameByID>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
