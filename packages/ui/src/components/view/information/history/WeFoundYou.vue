<template>
  <div>
    <span
      v-html="
        $t('weFoundYou.history', {
          cardName: $t('cardsInfo.weFoundYou'),
          cardOwner: playerNames[data.ownerID],
          selectedPlayer: playerNames[data.selectedPlayerID],
        })
      "
    >
    </span>
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
