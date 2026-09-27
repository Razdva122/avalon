<template>
  <div>
    <i18n-t keypath="restoreHonor.transfer" tag="span" scope="global">
      <template #cardName>{{ $t('cardsInfo.' + data.cardName) }}</template>
      <template #prevOwnerName
        ><b>{{ playerNames[data.prevOwnerID] }}</b></template
      >
      <template #newOwnerName
        ><b>{{ playerNames[data.newOwnerID] }}</b></template
      >
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { RestoreHonor } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<RestoreHonor>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
