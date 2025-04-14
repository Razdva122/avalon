<template>
  <div>
    <span
      v-html="
        $t('ambush.history', {
          ownerName: playerNames[data.ownerID],
          targetName: playerNames[data.targetID],
          result: data.result ? $t('inGame.' + data.result) : $t('ambush.resultHidden'),
        })
      "
    >
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { Ambush } from '@avalon/types';
import type { TPlayerNames } from '@/components/view/information/history/interface';

export default defineComponent({
  props: {
    data: {
      required: true,
      type: Object as PropType<Ambush>,
    },
    playerNames: {
      required: true,
      type: Object as PropType<TPlayerNames>,
    },
  },
});
</script>

<style scoped lang="scss"></style>
