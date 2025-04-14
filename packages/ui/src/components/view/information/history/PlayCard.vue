<template>
  <div>
    <span
      v-html="
        $t('playCard.history', {
          cardName: $t('cardsInfo.' + data.cardName),
          cardOwner: playerNames[data.ownerID],
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PlayCard } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<PlayCard>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
