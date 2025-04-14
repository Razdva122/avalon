<template>
  <div>
    <span
      v-html="
        $t('restoreHonor.transfer', {
          cardName: $t('cardsInfo.' + data.cardName),
          prevOwnerName: playerNames[data.prevOwnerID],
          newOwnerName: playerNames[data.newOwnerID],
        })
      "
    >
    </span>
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
