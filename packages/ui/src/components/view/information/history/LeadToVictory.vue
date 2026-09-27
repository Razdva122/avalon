<template>
  <div>
    <i18n-t keypath="leadToVictory.history" tag="span" scope="global">
      <template #cardName>{{ $t('cardsInfo.leadToVictory') }}</template>
      <template #prevLeaderName
        ><b>{{ playerNames[data.prevLeaderID] }}</b></template
      >
      <template #cardOwner
        ><b>{{ playerNames[data.ownerID] }}</b></template
      >
    </i18n-t>
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
