<template>
  <div>
    <span
      v-html="
        $t('checkLoyalty.checkInfo', {
          ladyOwner: playerNames[data.validatorID],
          ladyTarget: playerNames[data.inspectedID],
        })
      "
    ></span>
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
