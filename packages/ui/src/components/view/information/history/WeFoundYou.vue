<template>
  <div>
    <i18n-t keypath="weFoundYou.history" tag="span" scope="global">
      <template #cardName>{{ $t('cardsInfo.weFoundYou') }}</template>
      <template #cardOwner
        ><b>{{ playerNames[data.ownerID] }}</b></template
      >
      <template #selectedPlayer
        ><b>{{ playerNames[data.selectedPlayerID] }}</b></template
      >
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { WeFoundYou } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<WeFoundYou>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
