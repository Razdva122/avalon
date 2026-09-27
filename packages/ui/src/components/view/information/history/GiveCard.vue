<template>
  <div>
    <i18n-t v-if="data.target === 'player'" keypath="giveCard.toPlayer" tag="span" scope="global">
      <template #cardName>{{ $t('cardsInfo.' + data.cardName) }}</template>
      <template #leaderName
        ><b>{{ playerNames[data.leaderID] }}</b></template
      >
      <template #cardOwner
        ><b>{{ playerNames[data.ownerID] }}</b></template
      >
    </i18n-t>
    <i18n-t v-else keypath="giveCard.toSelf" tag="span" scope="global">
      <template #cardName>{{ $t('cardsInfo.' + data.cardName) }}</template>
      <template #leaderName
        ><b>{{ playerNames[data.leaderID] }}</b></template
      >
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { GiveCard } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<GiveCard>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
