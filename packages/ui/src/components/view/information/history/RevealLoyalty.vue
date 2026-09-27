<template>
  <div>
    <i18n-t keypath="revealLoyalty.revealInfo" tag="span" scope="global">
      <template #revealer
        ><b>{{ playerNames[data.revealerID] }}</b></template
      >
      <template #target
        ><b>{{ playerNames[data.targetID] }}</b></template
      >
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { RevealLoyalty } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<RevealLoyalty>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
