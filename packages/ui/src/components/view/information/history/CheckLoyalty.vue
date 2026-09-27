<template>
  <div>
    <i18n-t keypath="checkLoyalty.checkInfo" tag="span" scope="global">
      <template #ladyOwner
        ><b>{{ playerNames[data.validatorID] }}</b></template
      >
      <template #ladyTarget
        ><b>{{ playerNames[data.inspectedID] }}</b></template
      >
    </i18n-t>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { CheckLoyalty } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<CheckLoyalty>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
