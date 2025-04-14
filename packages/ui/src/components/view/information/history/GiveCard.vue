<template>
  <div>
    <span
      v-if="data.target === 'player'"
      v-html="
        $t('giveCard.toPlayer', {
          cardName: $t('cardsInfo.' + data.cardName),
          leaderName: playerNames[data.leaderID],
          cardOwner: playerNames[data.ownerID],
        })
      "
    >
    </span>
    <span
      v-else
      v-html="
        $t('giveCard.toSelf', {
          cardName: $t('cardsInfo.' + data.cardName),
          leaderName: playerNames[data.leaderID],
        })
      "
    >
    </span>
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
