<template>
  <div>
    <span
      v-html="
        $t('revealLoyalty.revealInfo', {
          revealer: playerNames[data.revealerID],
          target: playerNames[data.targetID],
        })
      "
    ></span>
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
