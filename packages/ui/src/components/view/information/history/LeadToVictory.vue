<template>
  <div>
    <span
      v-html="
        $t('leadToVictory.history', {
          cardName: $t('cardsInfo.leadToVictory'),
          prevLeaderName: playerNames[data.prevLeaderID],
          cardOwner: playerNames[data.ownerID],
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { LeadToVictory } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<LeadToVictory>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
